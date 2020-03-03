/*
 * @Description: 
 * @Version: 0.4.0
 * @Vender: D-link
 * @Author: YueXiangling
 * @Date: 2020-02-26 16:09:26
 * @LastEditRelease: 
 * @LastEditors: YueXiangling
 * @LastEditTime: 2020-02-28 16:55:18
 */
define(["serviceModule", 'mock'], function (services, Mock) {

    services.service("videoService", function (ajaxService) {
        this.videoListGrid = function (success, error) {
            var data = Mock.mock({
                'list|20': [{
                    'id|+1': 1,
                    'image': 'images/1.jpg',
                    'video': 'assets/3.mp4',
                    'text': 'Image1',
                    'name': 'ajdjkbdjdsfe'
                }]
            })
            // console.log(data)
            success(data)
            // ajaxService.post(base_url + '/org/listAll', success, error);
        }
    })

});