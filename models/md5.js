/**
 * @author yaobei on 2016/10/19
 * @md5加密文件
 */

//引入依赖包
var crypto = require("crypto");   //crypto模块，负责加密

//对外暴露md5加密接口
module.exports = function(password){
    var md5 = crypto.createHash('md5');
    var password = md5.update(password).digest('base64');
    return password;
}