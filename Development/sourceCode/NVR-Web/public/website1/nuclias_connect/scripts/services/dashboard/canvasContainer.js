/**
 * Created by zhiyuan on 2018/5/21.
 */

define(function () {
    var canvasContainer = function (canvas, context) {
        this.canvasScale = 1;
        this.canvas = canvas;
        this.context = context;
        this.translateOffX = this.canvas.width / 2;
        this.translateOffY = this.canvas.height / 2;
        this.devices = [];
        this.radius = 14;
    }

    canvasContainer.prototype = {
        initialImageArea: function (image) {

            this.image = image;
            this.imagearea = {};
            this.canvasScale = 1;
            this.translateOffX = this.canvas.width / 2;
            this.translateOffY = this.canvas.height / 2;

            this.len = 0;
            var px, py, pw, ph;
            var cheight = this.context.canvas.height - this.len * 2;
            var cwidth = this.context.canvas.width - this.len * 2;
            var rate = cheight / this.image.height;
            if (cwidth / cheight < this.image.width / this.image.height) {
                rate = cwidth / this.image.width;
                px = -cwidth / 2;
                py = -this.image.height * rate / 2;
            } else {
                px = -this.image.width * rate / 2;
                py = -cheight / 2;
            }

            pw = this.image.width * rate;
            ph = this.image.height * rate;

            px = px + this.len;
            py = py + this.len;

            this.rate = rate;

            this.imagearea.px = px;
            this.imagearea.py = py;
            this.imagearea.pw = pw;
            this.imagearea.ph = ph;
        },
        initialDevices: function (devices) {
            this.devices = devices;
            for (let i = 0; i < this.devices.length; i++) {
                var device = this.devices[i];
                if (!device.x || !device.y) {
                    device.x = this.canvas.width * (Math.random() - 1 / 2) * 0.9;
                    device.y = this.canvas.height * (Math.random() - 1 / 2) * 0.9;
                }
            }
        },
        setDevices: function (devices, rate) {
            this.devices = [];
            if (!devices)return;
            for (let i = 0; i < devices.length; i++) {
                var device = angular.copy(devices[i]);
                device.x *= this.rate / rate;
                device.y *= this.rate / rate;
                this.devices.push(device);
            }
        },
        clearCanvas: function () {
            this.context.setTransform(1, 0, 0, 1, 0, 0);
            this.context.clearRect(0, 0, this.canvas.width,
                this.canvas.height);
            this.context.fillStyle = "#eee";
            this.context.rect(0, 0, this.canvas.width,
                this.canvas.height);
            this.context.fill();
        },
        drawImage: function () {
            var a = this.canvasScale, b = 0, c = 0, d = this.canvasScale, e = this.translateOffX, f = this.translateOffY;
            this.context.setTransform(a, b, c, d, e, f);
            if (this.imagearea) {
                this.context.drawImage(this.image, this.imagearea.px,
                    this.imagearea.py, this.imagearea.pw, this.imagearea.ph);
            }
        },
        drawDevices: function () {
            if (this.devices) {

                this.context.strokeStyle = "#dddddd";
                for (var i = 0; i < this.devices.length; i++) {
                    var device = this.devices[i];

                    this.context.save();
                    if (device.mouseOver) {
                        this.context.lineWidth = 3;
                    } else {
                        this.context.lineWidth = 1;
                    }
                    if (this.trafficUsage) {
                        if (device.trafficUsage == -1) {
                            this.context.fillStyle = "#aaaaaa";
                        } else if (device.trafficUsage > this.trafficUsage.high) {
                            this.context.fillStyle = "#f25130";
                        } else if (device.trafficUsage < this.trafficUsage.average) {
                            this.context.fillStyle = "#22b7db";
                        } else {
                            this.context.fillStyle = "#a2bd18";
                        }
                    } else {
                        this.context.fillStyle = "#aaaaaa";
                    }
                    this.context.beginPath();
                    this.context.arc(device.x, device.y, this.radius, 0, Math.PI * 2);
                    this.context.closePath();
                    this.context.stroke();
                    this.context.fill();
                    this.context.restore();

                    if (device.uniqueClients && device.uniqueClients != -1) {
                        this.context.save();
                        this.context.fillStyle = "#fff";
                        this.context.font = "12px Arial";
                        var ww = this.context.measureText(device.uniqueClients).width;
                        this.context.fillText(device.uniqueClients, device.x - ww / 2, device.y + 6);
                        this.context.restore();
                    }

                    this.context.save();
                    this.context.fillStyle = "#fff";
                    this.context.globalAlpha = 0.85;
                    var w1 = this.context.measureText(device.name).width;
                    var w2 = this.context.measureText(device.ip).width;
                    var w = w1 > w2 ? w1 : w2;
                    this.context.beginPath();
                    this.context.rect(device.x - w / 2 - 8, device.y + 18, w + 16, 38);
                    this.context.closePath();
                    this.context.fill();
                    this.context.restore();

                    this.context.save();
                    this.context.globalAlpha = 1;
                    this.context.font = "11px Arial";
                    if (device.mouseOver) {
                        this.context.fillStyle = "#2095f2";
                    } else {
                        this.context.fillStyle = "#ef9212";
                    }
                    this.context.fillText(device.name, device.x - w1 / 2, device.y + 32);
                    this.context.fillText(device.ip, device.x - w2 / 2, device.y + 48);
                    this.context.restore();

                    if (device.isDelete) {
                        this.context.save();
                        this.context.strokeStyle = "#000";
                        this.context.lineWidth = 2;
                        this.context.beginPath();
                        this.context.arc(device.x, device.y, this.radius, 0, Math.PI * 2);
                        this.context.closePath();
                        this.context.stroke();
                        this.context.restore();
                    }

                }
            }
        },
        refresh: function () {
            this.clearCanvas();
            this.drawImage();
            this.drawDevices();
        },
        addMouseHandlers: function () {

            this.context.canvas.style.cursor = "pointer";
            var canvasMouseDown;

            var _self = this;
            var action = "none";
            var currentDevice;
            this.context.canvas.onmousedown = function (e) {
                e.preventDefault();
                var loc = windowToCanvas(e.clientX, e.clientY);
                canvasMouseDown = loc;
                currentDevice = null;
                for (var i = 0; i < _self.devices.length; i++) {
                    var device = _self.devices[i];
                    if (!currentDevice && loc.x < device.x + _self.radius && loc.x > device.x - _self.radius && loc.y < device.y + _self.radius && loc.y > device.y - _self.radius) {
                        currentDevice = device;
                        action = "One";
                        break;
                    }
                }
                if (!currentDevice) {
                    action = "All";
                }
            };
            this.context.canvas.onmousemove = function (e) {
                e.preventDefault();
                var loc = windowToCanvas(e.clientX, e.clientY);

                if (action == "All") {
                    var offX = loc.x - canvasMouseDown.x;
                    var offY = loc.y - canvasMouseDown.y;

                    _self.translateOffX += offX * _self.canvasScale;
                    _self.translateOffY += offY * _self.canvasScale;
                    _self.refresh();
                    _self.translateOffX -= offX * _self.canvasScale;
                    _self.translateOffY -= offY * _self.canvasScale;
                } else if (action == "One") {
                    var offX = loc.x - canvasMouseDown.x;
                    var offY = loc.y - canvasMouseDown.y;
                    currentDevice.x += offX;
                    currentDevice.y += offY;
                    _self.refresh();
                    currentDevice.x -= offX;
                    currentDevice.y -= offY;
                }
                else {
                    var tag = 0;
                    for (var i = 0; i < _self.devices.length; i++) {
                        var device = _self.devices[i];
                        if (tag == 0 && loc.x < device.x + _self.radius && loc.x > device.x - _self.radius && loc.y < device.y + _self.radius && loc.y > device.y - _self.radius) {
                            device.mouseOver = true;
                            tag = 1;
                        } else {
                            device.mouseOver = false;
                        }
                    }
                    _self.refresh();
                }
            };
            this.context.canvas.onmouseup = function (e) {
                e.preventDefault();
                var loc = windowToCanvas(e.clientX, e.clientY);
                if (action == "All") {
                    var offX = loc.x - canvasMouseDown.x;
                    var offY = loc.y - canvasMouseDown.y;

                    _self.translateOffX += offX * _self.canvasScale;
                    _self.translateOffY += offY * _self.canvasScale;
                    _self.refresh();
                    action = "none";
                } else if (action == "One") {
                    var offX = loc.x - canvasMouseDown.x;
                    var offY = loc.y - canvasMouseDown.y;
                    currentDevice.x += offX;
                    currentDevice.y += offY;
                    _self.refresh();
                    action = "none";
                }
            };

            function windowToCanvas(x, y) {
                var bbox = _self.canvas.getBoundingClientRect();
                return {
                    x: ((x - bbox.left) * (_self.canvas.width / bbox.width) - _self.translateOffX)
                    / _self.canvasScale,
                    y: ((y - bbox.top) * (_self.canvas.height / bbox.height) - _self.translateOffY)
                    / _self.canvasScale
                };
            };
        },
        addTipHandler: function (tipdiv, TS) {
            var _self = this;
            this.tipdiv = tipdiv;
            tipdiv.style.display = "none";
            this.context.canvas.onmousemove = function (e) {
                e.preventDefault();
                _self.tipdiv.style.display = "none";
                var loc = windowToCanvas(e.clientX, e.clientY);

                for (var i = 0; i < _self.devices.length; i++) {
                    var device = _self.devices[i];
                    if (loc.x < device.x + _self.radius && loc.x > device.x - _self.radius && loc.y < device.y + _self.radius && loc.y > device.y - _self.radius) {
                        var bbox = _self.canvas.getBoundingClientRect();
                        var width = bbox.width;
                        var left = (loc.x * _self.canvasScale + _self.translateOffX)
                            * bbox.width / _self.canvas.width + 10;
                        if (left + 260 < width) {
                            _self.tipdiv.style.left = left + "px";
                        } else {
                            _self.tipdiv.style.left = (width - 260) + "px";
                        }
                        var top = (loc.y * _self.canvasScale + _self.translateOffY)
                            * bbox.height / _self.canvas.height;
                        if (top + 160 < bbox.height) {
                            _self.tipdiv.style.top = top + "px";
                        } else {
                            _self.tipdiv.style.top = (bbox.height - 160) + "px";
                        }
                        _self.tipdiv.className = "heattip";
                        _self.tipdiv.style.display = "inline";
                        _self.tipdiv.style.zIndex = 999;
                        var html = "<p>" + TS.ts('report.heatip.deviceName') + ":<span>" + device.name + "</span></p>";
                        html += "<p>" +TS.ts('report.heatip.ipAddress') + ":<span>" + device.ip + "</span></p>";
                        html += "<p>" +TS.ts('report.heatip.macAdress') + ":<span>" + device.apMACAddr + "</span></p>";
                        html += "<p>" +TS.ts('report.heatip.location') + ":<span>" + device.location + "</span></p>";
                        html += "<p>" +TS.ts('report.heatip.uniqueClients') + ":<span>" + (device.uniqueClients == -1 ? "0" : device.uniqueClients) + "</span></p>";
                        html += "<p>" +TS.ts('report.heatip.trafficUsage') + ":<span>" + ((device.trafficUsage == -1 ? "0" : device.trafficUsage) ) + _self.trafficUsage.unit + "</span></p>";
                        _self.tipdiv.innerHTML = html;
                        break;
                    }
                }
            };
            function windowToCanvas(x, y) {
                var bbox = _self.canvas.getBoundingClientRect();
                return {
                    x: ((x - bbox.left) * (_self.canvas.width / bbox.width) - _self.translateOffX)
                    / _self.canvasScale,
                    y: ((y - bbox.top) * (_self.canvas.height / bbox.height) - _self.translateOffY)
                    / _self.canvasScale
                };
            };
        },
        zoomIn: function () {
            if (this.canvasScale >= 2)
                return;

            var n = 0.2;
            this.canvasScale = this.canvasScale + n;
            this.translateOffX = (2 * this.canvasScale * this.translateOffX - this.context.canvas.width
                * n)
                / (2 * (this.canvasScale - n));
            this.translateOffY = (2 * this.canvasScale * this.translateOffY - this.context.canvas.height
                * n)
                / (2 * (this.canvasScale - n));

            this.refresh();
        },
        zoomOut: function () {
            if (this.canvasScale <= 0.6)
                return;

            var n = -0.2;
            this.canvasScale = this.canvasScale + n;
            this.translateOffX = (2 * this.canvasScale * this.translateOffX - this.context.canvas.width
                * n)
                / (2 * (this.canvasScale - n));
            this.translateOffY = (2 * this.canvasScale * this.translateOffY - this.context.canvas.height
                * n)
                / (2 * (this.canvasScale - n));

            this.refresh();
        },
        zoomReset: function () {
            this.canvasScale = 1;
            this.translateOffX = this.canvas.width / 2;
            this.translateOffY = this.canvas.height / 2;
            this.refresh();
        },
        getImageDataURL: function () {
            return this.canvas.toDataURL("image/jpeg");
        }
    }

    return canvasContainer;
})