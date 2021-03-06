/**
 * Created by jialao on 2016/7/12.
 */

var mongoose = require('mongoose');
var	User = mongoose.model('User');
var	Article = mongoose.model('Article');
var	Tag = mongoose.model('Tag');
var Comment = mongoose.model('Comment');
var Promise = require('bluebird');

//初始化标签,文章,用户
 if(process.env.NODE_ENV === 'development'){
    User.countAsync().then(function (count) {
        if(count === 0){
            User.removeAsync().then(function () {
                User.createAsync({
                    nickname:'HJL',
                    email:'1617451312@qq.com',
                    role:'admin',
                    password:'111111'

                },{
                    nickname:'test001',
                    email:'test001@test.com',
                    role:'user',
                    password:'test'

                },{
                    nickname:'test002',
                    email:'test002@test.com',
                    role:'user',
                    password:'test'

                },{
                    nickname:'test003',
                    email:'test003@test.com',
                    role:'user',
                    password:'test'

                }).then(function(){
                    Tag.countAsync().then(function (count) {
                        if (count === 0) {
                            Tag.createAsync({
                                    name: 'nodejs'
                                }, {
                                    name: 'angular'
                                }, {
                                    name: 'react'
                                })
                                .then(function(){
                                    return Tag.findAsync()
                                })
                                .then(function (tags) {
                                    return Article.removeAsync().then(function () {
                                        return tags;
                                    });
                                }).map(function (tag, index) {
                                console.log(index)
                                var indexOne = parseInt(index) + 1;
                                var indexTwo = parseInt(index) + 2;
                                var indexThree = parseInt(index) + 3;
                                var indexFour = parseInt(index) + 4;
                                User.findOneAsync({nickname:'HJL'}).then(function(user){
                                    return Article.createAsync({
                                        title: '第' + (index + indexOne) + '篇文章',
                                        content: '<p>我第' + (index + indexOne) + '次爱你.</p>',
                                        tags: [tag._id],
                                        author_id:user._id
                                    }).then(function(article){
                                        return Comment.createAsync({
                                            aid:article._id,
                                            user_id:user._id,
                                            content:'good article!',
                                            replys:[
                                                {
                                                    content:'good apply!',
                                                    created:new Date(),
                                                    user_info:{
                                                        _id:user._id,
                                                        nickname:user.nickname,
                                                    }
                                                },
                                                {
                                                    content:'good apply!',
                                                    created:new Date(),
                                                    user_info:{
                                                        _id:user._id,
                                                        nickname:user.nickname,
                                                    }
                                                }
                                            ]
                                        })
                                    }).then(function(){
                                        return Article.createAsync({
                                        title: '第' + (index + indexTwo) + '篇文章',
                                        content: '<p>我第' + (index + indexTwo) + '次爱你.</p>',
                                        tags: [tag._id],
                                        author_id:user._id
                                    })
                                    }).then(function(article){
                                        return Comment.createAsync({
                                            aid:article._id,
                                            user_id:user._id,
                                            content:'good article!',
                                            replys:[
                                                {
                                                    content:'good apply!',
                                                    created:new Date(),
                                                    user_info:{
                                                        _id:user._id,
                                                        nickname:user.nickname,
                                                    }
                                                },
                                                {
                                                    content:'good apply!',
                                                    created:new Date(),
                                                    user_info:{
                                                        _id:user._id,
                                                        nickname:user.nickname,
                                                    }
                                                }
                                            ]
                                        })
                                    }).then(function(){
                                        return Article.createAsync({
                                        title: '第' + (index + indexTwo) + '篇文章',
                                        content: '<p>我第' + (index + indexTwo) + '次爱你.</p>',
                                        tags: [tag._id],
                                        author_id:user._id
                                    })
                                    }).then(function(article){
                                        return Comment.createAsync({
                                            aid:article._id,
                                            user_id:user._id,
                                            content:'good article!',
                                            replys:[
                                                {
                                                    content:'good apply!',
                                                    created:new Date(),
                                                    user_info:{
                                                        _id:user._id,
                                                        nickname:user.nickname,
                                                    }
                                                },
                                                {
                                                    content:'good apply!',
                                                    created:new Date(),
                                                    user_info:{
                                                        _id:user._id,
                                                        nickname:user.nickname,
                                                    }
                                                }
                                            ]
                                        })
                                    })
                                })
                            });

                        }
                    })
                });;
            });
        }
    });



 }
