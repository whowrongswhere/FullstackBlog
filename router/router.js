/**
 * @author yaobei on 2016/10/19
 * @路由
 */

//引入依赖包
var formidable = require("formidable");
var db = require("../models/db.js");
var md5 = require("../models/md5.js");
var path = require("path");
var fs = require("fs");
var gm = require("gm");    //图片处理包

//首页
exports.showIndex = function (req, res, next) {
    //检索数据库，查找此人的头像
    if (req.session.login == "1") {
        //如果登陆了
        var username = req.session.username;
        var password = req.session.password;
        var login = true;
    } else {
        //没有登陆
        var username = "";  //制定一个空用户名
        var password = "";  //制定一个空登录密码
        var login = false;
    }

    //已经登陆了，那么就要检索数据库，查登陆这个人的头像
    db.find("users", {username: username}, function (err, result) {
        if (result.length == 0) {
            var avatar = "moren.jpg";
        } else {
            var avatar = result[0].avatar;
        }
        res.render("index", {
            "login": login,
            "username": username,
            "password": password,
            "active": "首页",
            "avatar": avatar    //登录人的头像
        });
    });
};

//注册页面
exports.showRegist = function (req, res, next) {
    res.render("regist", {
        "login": req.session.login == "1" ? true : false,
        "username": req.session.login == "1" ? req.session.username : "",
        "password": req.session.login == "1" ? req.session.password : "",
        "active": "注册"
    });
};

//注册业务
exports.doRegist = function (req, res, next) {
    //得到用户填写的东西
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        //点击注册之后获取表单参数
        var username = fields.username;
        var password = fields.password;

        //console.log(username,password);
        //查询数据库中是不是有这个人
        db.find("users", {"username": username}, function (err, result) {
            if (err) {
                res.send("-3"); //服务器错误
                return;
            }
            if (result.length != 0) {
                res.send("-1"); //被占用
                return;
            }
            //没有相同的人，就可以执行接下来的代码了
            password = md5(md5(password) + "nodejs");  //采用md5加密方法

            //现在可以证明，用户名没有被占用
            db.insertOne("users", {
                "username": username,
                "password": password,
                "avatar": "moren.jpg"
            }, function (err, result) {
                if (err) {
                    res.send("-3"); //服务器错误
                    return;
                }
                req.session.login = "1";
                req.session.username = username;

                res.send("1"); //注册成功，写入session
            })
        });
    });
};

//显示登陆页面
exports.showLogin = function (req, res, next) {
    res.render("login", {
        "login": req.session.login == "1" ? true : false,
        "username": req.session.login == "1" ? req.session.username : "",
        "password": req.session.login == "1" ? req.session.password : "",
        "active": "登陆"
    });
};

//登录页面的登录执行
exports.doLogin = function (req, res, next) {
    //得到用户表单
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        //得到表单之后做的事情
        var username = fields.username;
        var password = fields.password;
        var md5Password = md5(md5(password) + "nodejs");
        //查询数据库，看看有没有个这个人
        db.find("users", {"username": username}, function (err, result) {
            if (err) {
                res.send("-5");
                return;
            }
            //用户名不存在
            if (result.length == 0) {
                res.send("-1");
                return;
            }
            //用户名存在，进一步看看这个人的密码是否匹配
            if (md5Password == result[0].password) {
                req.session.login = "1";   //设置session
                req.session.username = username;
                req.session.password = result[0].password;
                res.send("1");  //登陆成功
                return;
            } else {
                res.send("-2");  //密码错误
                return;
            }
        });
    });
};

//退出登录操作
exports.doLogOff = function (req, res) {
    req.session.login = null;
    req.session.username = null;
    req.session.password = null;
    //跳转到首页
    res.redirect("/");
};

//显示修改密码页面
exports.modifyPassword = function (req, res) {
    var password = req.params["password"];
    //必须保证登陆
    if (req.session.login != "1") {
        res.end("非法闯入，这个页面要求登陆！");
        return;
    }
    res.render("modifypassword", {
        "login": req.session.login == "1" ? true : false,
        "username": req.session.login == "1" ? req.session.username : "",
        "password": req.session.login == "1" ? req.session.password : "",
        "active": "修改密码"
    })


};

//修改密码操作
exports.doModifyPassword = function (req, res) {
    //用户修改密码表单
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        var newPassword = fields.newPassword;
        var newPasswordTwo = fields.newPasswordTwo;
        var md5NewPassword = md5(md5(newPassword) + "nodejs");
        var md5NewPasswordTwo = md5(md5(newPasswordTwo) + "nodejs");

        if(newPassword == "" || newPasswordTwo == "" ) {
            res.send("-1");
            return;
        }
        else if(md5NewPassword != md5NewPasswordTwo) {
            res.send("-2");
            return;
        }

        //更改数据库当前用户的密码
        db.updateMany("users", {"username": req.session.username}, {
            $set: {"password": md5NewPassword}
        }, function (err, results) {
            res.send("1");
        });
    });
};


//设置头像页面，必须保证此时是登陆状态
exports.showSetAvatar = function (req, res, next) {
    //必须保证登陆
    if (req.session.login != "1") {
        res.end("非法闯入，这个页面要求登陆！");
        return;
    }
    res.render("setavatar", {
        "login": true,
        "username": req.session.username || "小花花",
        "password": req.session.password,
        "active": "修改头像"
    });
};

//设置头像
exports.doSetAvatar = function (req, res, next) {
    //必须保证登陆
    if (req.session.login != "1") {
        res.end("非法闯入，这个页面要求登陆！");
        return;
    }

    var form = new formidable.IncomingForm();
    form.uploadDir = path.normalize(__dirname + "/../avatar");
    form.parse(req, function (err, fields, files) {
        console.log(files);
        var oldpath = files.uploadAvator.path;
        var newpath = path.normalize(__dirname + "/../avatar") + "/" + req.session.username + ".jpg";
        fs.rename(oldpath, newpath, function (err) {
            if (err) {
                res.send("失败");
                return;
            }
            req.session.avatar = req.session.username + ".jpg";
            //跳转到切的业务
            res.redirect("/cut");
        });
    });
}

//显示切图页面
exports.showcut = function (req, res) {
    //必须保证登陆
    if (req.session.login != "1") {
        res.end("非法闯入，这个页面要求登陆！");
        return;
    }
    res.render("cut", {
        avatar: req.session.avatar
    })
};

//执行切图
exports.doCut = function (req, res, next) {
    //必须保证登陆
    if (req.session.login != "1") {
        res.end("非法闯入，这个页面要求登陆！");
        return;
    }

    //这个页面接收几个GET请求参数--w、h、x、y
    var filename = req.session.avatar;
    var w = req.query.w;
    var h = req.query.h;
    var x = req.query.x;
    var y = req.query.y;

    gm("./avatar/" + filename)
        .crop(w, h, x, y)
        .resize(100, 100, "!")
        .write("./avatar/" + filename, function (err) {
            if (!err) {
                //res.send("-1");
                //return;
            }
            //更改数据库当前用户的avatar这个值
            db.updateMany("users", {"username": req.session.username}, {
                $set: {"avatar": req.session.avatar}
            }, function (err, results) {
                res.send("1");
            });
        });
}


//发表说说
exports.doPost = function (req, res, next) {
    //必须保证登陆
    if (req.session.login != "1") {
        res.end("非法闯入，这个页面要求登陆！");
        return;
    }
    //用户名
    var username = req.session.username;

    //得到用户填写的东西
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        //得到表单之后做的事情
        var content = fields.content;

        //现在可以证明，用户名没有被占用
        db.insertOne("posts", {
            "username": username,
            "datetime": new Date(),
            "content": content
        }, function (err, result) {
            if (err) {
                res.send("-3"); //服务器错误
                return;
            }
            res.send("1"); //注册成功
        });
    });
};


//列出所有说说，有分页功能
exports.getAllTalk = function(req,res,next){
    //这个页面接收一个参数，页面
    var page = req.query.page;
    db.find("posts",{},{"pageamount":3,"page":page,"sort":{"datetime":-1}},function(err,result){
        res.json(result);
    });
};


//列出某个用户的信息
exports.getUserInfo = function(req,res,next){
    //这个页面接收一个参数，页面
    var username = req.query.username;
    db.find("users",{"username":username},function(err,result){
        if(err || result.length == 0){
            res.json("");
            return;
        }
        var obj = {
            "username" : result[0].username,
            "password" : result[0].password,
            "avatar" : result[0].avatar,
            "_id" : result[0]._id,
        };
        res.json(obj);
    });
};

//说说总数
exports.getPublicTalkAmount = function(req,res,next){
    db.getAllCount("posts",function(count){
        res.send(count.toString());
    });
};

//显示某一个用户的个人主页
exports.showUser = function(req,res,next){
    var user = req.params["user"];
    db.find("posts",{"username":user},function(err,result){
       db.find("users",{"username":user},function(err,result2){
           res.render("user",{
               "login": req.session.login == "1" ? true : false,
               "username": req.session.login == "1" ? req.session.username : "",
               "password": req.session.login == "1" ? req.session.password : "",
               "user" : user,
               "active" : "我的说说",
               "personalTalk" : result,
               "personalAvatar" : result2[0].avatar
           });
       });
    });

}

//显示所有成员列表
exports.showUserList = function(req,res,next){
    db.find("users",{},function(err,result){
        res.render("userList",{
            "login": req.session.login == "1" ? true : false,
            "username": req.session.login == "1" ? req.session.username : "",
            "password": req.session.login == "1" ? req.session.password : "",
            "active" : "成员列表",
            "allMemberList" : result
        });
    });
}

//显示个人中心页面
exports.account = function(req,res){
    var user = req.params["user"];
    db.find("users",{"username":user},function(err,result){
        res.render("account",{
            "login": req.session.login == "1" ? true : false,
            "username": req.session.login == "1" ? req.session.username : "",
            "password": req.session.login == "1" ? req.session.password : "",
            "user" : user,
            "active" : "我的说说",
            "personalAvatar" : result[0].avatar
        });
    });


}

//修改个人信息操作
exports.doModifyAccont = function (req, res) {
    var hover = [];  //初始化爱好数组
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        var age = fields.age;
        var sex = fields.sex;
        if(age == "") {
            res.send("-1");
            return;
        }
        else if(sex == "") {
            res.send("-2");
            return;
        }
        else if(fields.hover == null) {
            res.send("-3");
            return;
        }
        for(var i=0;i<fields.hover.length;i++) {
            hover.push(fields.hover[i]);
        }
        //更改数据库当前用户的密码
        db.updateMany("users", {"username": req.session.username}, {
            $set: {"age": age,"sex":sex,"hover":hover}
        }, function (err, results) {
            res.send("1");
        });
    });
};