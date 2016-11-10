/**
 * @author yaobei on 2016/10/19
 * @启动文件
 */

//引入依赖包
var express = require("express");
var app = express();
var session = require('express-session');
var router = require("./router/router.js");

//使用session
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));

//设置模板引擎
app.set("view engine","ejs");

//使用静态文件
app.use(express.static("./public"));

//使用静态文件
app.use("/avatar",express.static("./avatar"));

//路由表
app.get("/",router.showIndex);                               //显示首页
app.get("/regist",router.showRegist);                        //显示注册页面
app.post("/doRegist",router.doRegist);                       //执行注册，Ajax服务
app.get("/login",router.showLogin);                          //显示登陆页面
app.post("/doLogin",router.doLogin);                         //执行登录，Ajax服务
app.get("/doLogOff",router.doLogOff);                        //退出登录操作
app.get("/modifyPassword/:password",router.modifyPassword);  //显示修改密码页面
app.post("/doModifyPassword",router.doModifyPassword);       //修改密码操作
app.get("/setAvatar",router.showSetAvatar);                  //设置头像页面
app.post("/doSetAvatar",router.doSetAvatar);                 //执行设置头像，Ajax服务
app.get("/cut",router.showcut);                              //剪裁头像页面
app.post("/doPost",router.doPost);                           //发表说说
app.get("/doCut",router.doCut);                              //执行剪裁操作
app.get("/getAllTalk",router.getAllTalk);                    //列出所有说说Ajax服务
app.get("/getUserInfo",router.getUserInfo);                  //列出所有说说Ajax服务
app.get("/getPublicTalkAmount",router.getPublicTalkAmount);  //说说总数
app.get("/user/:user",router.showUser);                      //显示用户所有说说
app.get("/userList",router.showUserList);                    //显示所有成员列表
app.get("/account/:user",router.account);                    //显示个人中心页面
app.post("/doModifyAccont",router.doModifyAccont);           //修改个人中心信息操作


app.listen(3000);
