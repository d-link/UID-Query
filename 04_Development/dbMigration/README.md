
# dbMigration
sqlite数据库迁移工具

## 1.编译
进入dbMigration目录，执行以下命令即可:

 ` make `

## 2.使用
` ./dbmMigration 来源数据库 目标数据库 `
<br/>
目标数据库可以不用预先存在

## 3.返回值
成功：
` {
    "success": true,
    "error": null
} `

失败：
` {                     
    "success": false, 
    "error": 错误代码    
}                      `


