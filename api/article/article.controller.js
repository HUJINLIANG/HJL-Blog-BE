/**
 * Created by jialao on 2016/7/13.
 */
var _ = require('lodash');
var mongoose = require('mongoose');
var Article = mongoose.model('Article');
var User = mongoose.model('User');
var Comment = mongoose.model('Comment');
var path = require('path');
var MarkdownIt = require('markdown-it');
var config = require('../../config/env');
var Promise = require('bluebird');
var formidable = require('formidable');
var multipart = require('connect-multiparty')
var fs = require('fs');
var path = require('path')
var AVATAR_UPLOAD_FOLDER = path.join(__dirname,'../../public/upload/')

exports.getFrontArticleCount = function(req,res,next){
    var condition = {};
    if(req.query.tagId){
        var tagId = String(req.query.tagId);
        condition = _.defaults(condition,{tags:{$elemMatch:{$eq:tagId}}});

    }
    Article.countAsync(condition).then(function(count){
        return res.status(200).json({
            success:true,
            count:count
        })
    }).catch(function(err){
        return next(err);
    })
};

exports.getFrontArticleList = function(req,res,next){
    var currentPage = (parseInt(req.query.currentPage) > 0)?parseInt(req.query.currentPage):1;
    var itemsPerPage = (parseInt(req.query.itemsPerPage) > 0)?parseInt(req.query.itemsPerPage):10;
    var startRow = (currentPage - 1) * itemsPerPage;
    var sort = String(req.query.sortName) || "created";
    sort = "-" + sort;
    var condition = {};
    if(req.query.tagId){

        var tagId = String(req.query.tagId);
        condition = _.defaults(condition,{ tags: { $elemMatch: { $eq:tagId } } });
    }


    Article.countAsync(condition)
        .then(function(count){
        return  Article.find(condition)
            .populate({
                path:'tags',
                select:'name'
            })
            .skip(startRow)
            .limit(itemsPerPage)
            .sort(sort)
            .exec().then(function(result){
                return res.status(200).json({
                    data:result,count:count
                })
            })
    }).catch(function(err){
        return next(err);
    });

    // Article.find(condition)
    //     .populate({
    //         path:'tags',
    //         select:'name'
    //     })
    //     .skip(startRow)
    //     .limit(itemsPerPage)
    //     .sort(sort)
    //     .exec().then(function(result){
    //     return res.status(200).json({
    //         data:result
    //     }).catch(function(err){
    //         return next(err);
    //     });
    // })
};

exports.getFrontArticle = function(req,res,next){
    var id = req.params.id ;
    var md = new MarkdownIt({
        html:true
    });

    return Article.findByIdAsync(id).then(function(result){

        result.content = md.render(result.content);
        result.visit_count++;
        Article.findByIdAndUpdateAsync(id,{$inc:{visit_count:1}});
        return res.status(200).json({data:result.info});
    })
};

exports.toggleLike = function(req,res,next){
    var aid = new mongoose.Types.ObjectId(req.params.id);
    var userId = req.user._id;

    var isLike = _.findIndex(req.user.likeList,function(item){
        return item.toString() == req.params.id;
    });
    var conditionOne,conditionTwo,liked;
    if(isLike != -1){
        conditionOne = {'$pull':{'likeList':aid}};
        conditionTwo = {'$inc':{'like_count':-1}};
        liked = false;
    }else{
        conditionOne = {'$addToSet':{'likeList':aid}};
        conditionTwo = {'$inc':{'like_count':1}};
        liked = true;
    }

    User.findByIdAndUpdateAsync(userId,conditionOne).then(function(user){
        return Article.findByIdAndUpdateAsync(aid,conditionTwo,{new:true}).then(function(article){
            return res.status(200).json({
                success:true,
                count:article.like_count,
                isLike:liked
            })
        }).catch(function(err){
            return next(err);
        })
    })
};

exports.getPrenext = function(req,res,next){
    console.log(req.query)
    var id = req.params.id;
    var sort = String(req.query.sortName) || 'created';
    var preCondition={};
    var nextCondition={};
    if(req.query.tagId){
        var tagId = String(req.query.tagId);
        preCondition = _.defaults(preCondition,{tags:{$elemMatch:{$eq:tagId}}});
        nextCondition = _.defaults(nextCondition,{tags:{$elemMatch:{$eq:tagId}}});
    }
    Article.findByIdAsync(id).then(function(article){
        console.log(article)
        if(sort == 'visit_count'){
            preCondition = _.defaults(preCondition,{'_id':{$ne:id},'visit_count':{'$lte':article.visit_count+1}});
            nextCondition = _.defaults(nextCondition,{'_id':{$ne:id},'visit_count':{'$gte':article.visit_count+1}});
            console.log(preCondition)
            console.log(nextCondition)
        }else{
            preCondition = _.defaults(preCondition,{'_id':{$ne:id},'created':{'$lte':article.created}});
            nextCondition = _.defaults(nextCondition,{'_id':{$ne:id},'created':{'$gte':article.created}});
            console.log(preCondition)
            console.log(nextCondition)
        };

        Article.find(preCondition)
            .select('title')
            .sort('-' + sort)
            .exec().then(function(results){
            console.log(results)
        }).catch(function(err){
            console.log(err)
        })
        Article.find(nextCondition)
            .select('title')
            .sort('-'+ sort)
            .exec().then(function(results){
            console.log(results)
        })

        var prePromise = Article.find(preCondition)
            .select('title')
            .limit(1)
            .sort('-'+sort)
            .exec();
        var nextPromise = Article.find(nextCondition)
            .select('title')
            .limit(1)
            .sort(sort)
            .exec();
        prePromise.then(function(preResult){
            var prev = preResult[0] || {};
            return nextPromise.then(function(nextResult){
                var next = nextResult[0] || {};
                return {
                    'next':prev,
                    'prev':next
                }
            })
        }).then(function(result){
            console.log(result)
            return res.status(200).json({
                data:result
            })
        })

    }).catch(function(err){
        return next(err);
    })
}


//admin
exports.getArticleList = function(req,res,next) {
    Article.find()
        .select('title visit_count comment_count like_count created')
        .sort('created')
        .exec()
        .then(function(articleList){
            return res.status(200).json({data:articleList})
        })
}

exports.destroy = function(req,res,next){
    var id = req.params.id;
    Article.findByIdAndRemoveAsync(id)
        .then(function(){
            return Comment.removeAsync({aid:id})
                .then(function(){
                    return res.status(200).send({success:true})
                })
        }).catch(function(err){
            return next(err);
        })
}

exports.addArticle = function(req,res,next){
    var content = req.body.content;
    var title = req.body.title;
    var error_msg;
    if(!title){
        error_msg = '标题不能为空'
    }else if(!content){
        error_msg = '内容不能为空'
    }
    if(error_msg){
        return res.status(422).send({error_msg:error_msg})
    }
    
    req.body.author_id = req.user._id;

    //解析content,保存images
    var images = [];
    var imageRegExp = /([^\(]*\.(jpe?g|png|gif))(?=\))/g;

    content.replace(imageRegExp,function(match){
        images.push(match);
        return match;
    });

    req.body.images = images;
    
    console.log(req.body)

    return Article.createAsync(req.body)
        .then(function(result){
        return res.status(200).json({data:result})
    })
}

exports.upload = function(req,res) {


   

    //get filename
    var filename = req.files.files.originalFilename || path.basename(req.files.files.ws.path);

    

    //copy file to a public directory
    var targetPath =AVATAR_UPLOAD_FOLDER + filename;

    

    //copy file
    fs.createReadStream(req.files.files.path).pipe(fs.createWriteStream(targetPath));
    //return file url
    res.json({code: 200, msg: {url: 'http://' + req.headers.host + '/upload' + filename}});




    // console.log(req.body)

//     var form = new formidable.IncomingForm();   //创建上传表单
//     form.encoding = 'utf-8';		//设置编辑
//     form.uploadDir =   AVATAR_UPLOAD_FOLDER;	 //设置上传目录
//     form.keepExtensions = true;	 //保留后缀
//     form.maxFieldsSize = 20 * 1024 * 1024;   //文件大小
//
//     form.parse(req, function(err, fields, files) {
//
//         console.log(fields)
//         console.log(files)
//       
//
//         if (err) {
//
//             return res.status(403).send({error_msg:'只支持png和jpg格式图片'});
//         }
//
//         var extName = '';  //后缀名
//         switch (files.fulAvatar.type) {
//             case 'image/pjpeg':
//                 extName = 'jpg';
//                 break;
//             case 'image/jpeg':
//                 extName = 'jpg';
//                 break;
//             case 'image/png':
//                 extName = 'png';
//                 break;
//             case 'image/x-png':
//                 extName = 'png';
//                 break;
//         }
//
//         if(extName.length == 0){
//             return res.status(403).send({error_msg:'只支持png和jpg格式图片'});
//         }
//
//         var filename = files.fulAvatar.name;
//
//         var newPath = form.uploadDir + filename;
//
//         console.log(newPath);
//         fs.renameSync(files.fulAvatar.path, newPath);  //重命名
//         return res.status(200).json({success:true});
//     });
//    
}