/**
 * Created by lizhimin on 2015/12/17.
 */

define(["serviceModule", "moment"], function (services, moment) {
    services.service("utils", function (TS, CommonService, $timeout, $rootScope) {
        this.findById = function (a, id) {
            for (var i = 0; i < a.length; i++) {
                if (a[i].id == id) return a[i];
            }
            return null;
        };
        this.newRandomKey = function (coll, key, currentKey) {
            var randKey;
            do {
                randKey = coll[Math.floor(coll.length * Math.random())][key];
            } while (randKey == currentKey);
            return randKey;
        };
        this.storageToUnit = function (bytes, type) { // type = 0 byte,1 kbyte,2 mbyte,3 gbyte,
            function getRoundVal(total, power) {
                return (total / Math.pow(1024, power)).toFixed(2);
            }

            var totalBytes = bytes * Math.pow(1024, type);
            var str = '';
            if (totalBytes < 1024) {
                str = totalBytes.toFixed(2);
            } else if (getRoundVal(totalBytes, 1) < 1024) {
                str = getRoundVal(totalBytes, 1) + " K";
            }
            else if (getRoundVal(totalBytes, 2) < 1024) {
                str = getRoundVal(totalBytes, 2) + " M";
            }
            else if (getRoundVal(totalBytes, 3) < 1024) {
                str = getRoundVal(totalBytes, 3) + " G";
            }
            else if (getRoundVal(totalBytes, 4) < 1024) {
                str = getRoundVal(totalBytes, 4) + " T";
            }
            else {
                str = getRoundVal(totalBytes, 5) + " P";
            }
            return str;
        }
        this.ConvertToUnit = function (totalBytes, isBitValue) {

            function getRoundVal(total, power) {
                return (total / Math.pow(10, power)).toFixed(2);
            }

            var str = '';
            if (isBitValue) totalBytes = totalBytes / 8;
            totalBytes = parseFloat(totalBytes);
            if (totalBytes < 1000) {
                str = totalBytes.toFixed(2) + " Byte";
            } else if (getRoundVal(totalBytes, 3) < 1000) {
                str = getRoundVal(totalBytes, 3) + " KB";
            }
            else if (getRoundVal(totalBytes, 6) < 1000) {
                str = getRoundVal(totalBytes, 6) + " MB";
            }
            else if (getRoundVal(totalBytes, 9) < 1000) {
                str = getRoundVal(totalBytes, 9) + " GB";
            }
            else if (getRoundVal(totalBytes, 12) < 1000) {
                str = getRoundVal(totalBytes, 12) + " TB";
            }
            else {
                str = getRoundVal(totalBytes, 15) + " PB";
            }
            return str;
        }
        this.ConvertMBToUnit = function (totalBytes) {
            function getRoundVal(total, power) {
                return (total / Math.pow(10, power)).toFixed(2);
            }

            var str = '';
            totalBytes = parseFloat(totalBytes);
            if (totalBytes < 1000) {
                str = totalBytes.toFixed(2) + " MB";
            } else if (getRoundVal(totalBytes, 3) < 1000) {
                str = getRoundVal(totalBytes, 3) + " GB";
            }
            else if (getRoundVal(totalBytes, 6) < 1000) {
                str = getRoundVal(totalBytes, 6) + " TB";
            }
            else {
                str = getRoundVal(totalBytes, 9) + " PB";
            }
            return str;
        }
        this.ConvertBytesByUnit = function (totalBytes, unit) {
            function getRoundVal(total, power) {
                return (total / Math.pow(10, power)).toFixed(2);
            }

            var str = '';
            totalBytes = parseFloat(totalBytes);
            if (unit == 'Byte') {
                str = this.ConvertToUnit(totalBytes, false);
            }
            else if (unit == 'KB') {
                if (totalBytes < 1000) {
                    str = totalBytes.toFixed(2) + " KB";
                } else {
                    totalBytes = getRoundVal(totalBytes, 3);
                    str = this.ConvertMBToUnit(totalBytes);
                }
            }
            else if (unit == 'MB') {
                str = this.ConvertMBToUnit(totalBytes);
            } else if (unit == 'GB') {
                if (totalBytes < 1000) {
                    str = totalBytes.toFixed(2) + " GB";
                } else if (getRoundVal(totalBytes, 3) < 1000) {
                    str = getRoundVal(totalBytes, 3) + " TB";
                }
                else {
                    str = getRoundVal(totalBytes, 6) + " PB";
                }
            } else {
                str = totalBytes.toFixed(2) + " " + unit;
            }
            return str;

        }
        this.getVlanText = function () {
            return {
                mgmt: TS.ts("configuration.vlan.mgmt"),
                Lan: TS.ts("configuration.vlan.lan"),
                lan1: TS.ts("configuration.vlan.lan") + "1",
                lan2: TS.ts("configuration.vlan.lan") + "2",
                primary24g: TS.ts('configuration.band.ssid1') + " (2.4G)",
                ssid24g1: "SSID1 (2.4G)",
                ssid24g2: "SSID2 (2.4G)",
                ssid24g3: "SSID3 (2.4G)",
                ssid24g4: "SSID4 (2.4G)",
                ssid24g5: "SSID5 (2.4G)",
                ssid24g6: "SSID6 (2.4G)",
                ssid24g7: "SSID7 (2.4G)",
                primary5g: TS.ts('configuration.band.ssid1') + " (5G 1)",
                ssid5g1: "SSID1 (5G 1)",
                ssid5g2: "SSID2 (5G 1)",
                ssid5g3: "SSID3 (5G 1)",
                ssid5g4: "SSID4 (5G 1)",
                ssid5g5: "SSID5 (5G 1)",
                ssid5g6: "SSID6 (5G 1)",
                ssid5g7: "SSID7 (5G 1)",
                primarySec5g: TS.ts('configuration.band.ssid1') + " (5G 2)",
                ssidSec5g1: "SSID1 (5G 2)",
                ssidSec5g2: "SSID2 (5G 2)",
                ssidSec5g3: "SSID3 (5G 2)",
                ssidSec5g4: "SSID4 (5G 2)",
                ssidSec5g5: "SSID5 (5G 2)",
                ssidSec5g6: "SSID6 (5G 2)",
                ssidSec5g7: "SSID7 (5G 2)",
            };
        }
        this.changeUnit = function (value, unit) {
            value = value * Math.pow(1000, 1);
            // 然后将原始值转成相应的值
            if (value < 1000) {
                return Math.round(value * 100) / 100 + " " + unit;
            }
            else if (value >= 1000 && value < Math.pow(1000, 2)) {
                return Math.round((value / 1000) * 100) / 100 + " K" + unit;
            }
            else if (value >= Math.pow(1000, 2) && value < Math.pow(1000, 3)) {
                return Math.round((value / (Math.pow(1000, 2))) * 100) / 100 + " M" + unit;
            }
            else if (value >= Math.pow(1000, 3) && value < Math.pow(1000, 4)) {
                return Math.round((value / (Math.pow(1000, 3))) * 100) / 100 + " G" + unit;
            }
            else if (value >= Math.pow(1000, 4) && value < Math.pow(1000, 5)) {
                return Math.round((value / (Math.pow(1000, 4))) * 100) / 100 + " T" + unit;
            }
            else if (value >= Math.pow(1000, 5) && value < Math.pow(1000, 6)) {
                return Math.round((value / (Math.pow(1000, 5))) * 100) / 100 + " P" + unit;
            }
            else if (value >= Math.pow(1000, 6) && value < Math.pow(1000, 7)) {
                return Math.round((value / (Math.pow(1000, 6))) * 100) / 100 + " E" + unit;
            }
            else if (value >= Math.pow(1000, 7) && value < Math.pow(1000, 8)) {
                return Math.round((value / (Math.pow(1000, 7))) * 100) / 100 + " Z" + unit;
            }
            else if (value >= Math.pow(1000, 8) && value < Math.pow(1000, 9)) {
                return Math.round((value / (Math.pow(1000, 8))) * 100) / 100 + " T" + unit;
            }
            else {
                return Math.round((value / (Math.pow(1000, 9))) * 100) / 100 + " B" + unit;
            }
        }
        this.getWeeks = function () {
            return [{id: 0, name: TS.ts('configuration.dev.day0')},
                {id: 1, name: TS.ts('configuration.dev.day1')},
                {id: 2, name: TS.ts('configuration.dev.day2')},
                {id: 3, name: TS.ts('configuration.dev.day3')},
                {id: 4, name: TS.ts('configuration.dev.day4')},
                {id: 5, name: TS.ts('configuration.dev.day5')},
                {id: 6, name: TS.ts('configuration.dev.day6')}]
        }
        this.getMonths = function () {
            return [{id: 1, name: TS.ts("configuration.dev.month1")},
                {id: 2, name: TS.ts("configuration.dev.month2")},
                {id: 3, name: TS.ts("configuration.dev.month3")},
                {id: 4, name: TS.ts("configuration.dev.month4")},
                {id: 5, name: TS.ts("configuration.dev.month5")},
                {id: 6, name: TS.ts("configuration.dev.month6")},
                {id: 7, name: TS.ts("configuration.dev.month7")},
                {id: 8, name: TS.ts("configuration.dev.month8")},
                {id: 9, name: TS.ts("configuration.dev.month9")},
                {id: 10, name: TS.ts("configuration.dev.month10")},
                {id: 11, name: TS.ts("configuration.dev.month11")},
                {id: 12, name: TS.ts("configuration.dev.month12")}];
        }
        this.getCountries = function () {

            return [{"id": 1, "name": "﻿Afghanistan", "ccode": "EU/UK"},
                {"id": 2, "name": "Aland Islands", "ccode": "EU/UK"},
                {"id": 3, "name": "Albania", "ccode": "EU/UK"},
                {"id": 4, "name": "Algeria", "ccode": "EU/UK"},
                {"id": 5, "name": "American Samoa", "ccode": "US/NA"},
                {"id": 6, "name": "Andorra", "ccode": "EU/UK"},
                {"id": 7, "name": "Angola", "ccode": "EU/UK"},
                {"id": 8, "name": "Anguilla", "ccode": "EU/UK"},
                {"id": 9, "name": "Antarctica", "ccode": "EU/UK"},
                {"id": 10, "name": "Antigua and Barbuda", "ccode": "AU"},
                {"id": 11, "name": "Argentina", "ccode": "AU"},
                {"id": 12, "name": "Armenia", "ccode": "RU"},
                {"id": 13, "name": "Aruba", "ccode": "AU"},
                {"id": 14, "name": "Australia", "ccode": "AU"},
                {"id": 15, "name": "Austria", "ccode": "EU/UK"},
                {"id": 16, "name": "Azerbaijan", "ccode": "RU"},
                {"id": 17, "name": "Bahamas", "ccode": "AU"},
                {"id": 18, "name": "Bahrain", "ccode": "EU/UK"},
                {"id": 19, "name": "Bangladesh", "ccode": "IN"},
                {"id": 20, "name": "Barbados", "ccode": "AU"},
                {"id": 21, "name": "Belarus", "ccode": "RU"},
                {"id": 22, "name": "Belgium", "ccode": "EU/UK"},
                {"id": 23, "name": "Belize", "ccode": "AU"},
                {"id": 24, "name": "Benin", "ccode": "EU/UK"},
                {"id": 25, "name": "Bermuda", "ccode": "EU/UK"},
                {"id": 26, "name": "Bhutan", "ccode": "IN"},
                {"id": 27, "name": "Bolivia", "ccode": "AU"},
                {"id": 28, "name": "Bonaire, Saint Eustatius and Saba ", "ccode": "AU"},
                {"id": 29, "name": "Bosnia and Herzegovina", "ccode": "EU/UK"},
                {"id": 30, "name": "Botswana", "ccode": "EU/UK"},
                {"id": 31, "name": "Brazil", "ccode": "AU"},
                {"id": 32, "name": "British Indian Ocean Territory", "ccode": "EU/UK"},
                {"id": 33, "name": "British Virgin Islands", "ccode": "EU/UK"},
                {"id": 34, "name": "Brunei", "ccode": "EU/UK"},
                {"id": 35, "name": "Bulgaria", "ccode": "EU/UK"},
                {"id": 36, "name": "Burkina Faso", "ccode": "EU/UK"},
                {"id": 37, "name": "Burundi", "ccode": "EU/UK"},
                {"id": 38, "name": "Cambodia", "ccode": "SG"},
                {"id": 39, "name": "Cameroon", "ccode": "EU/UK"},
                {"id": 40, "name": "Canada", "ccode": "US/NA"},
                {"id": 41, "name": "Cape Verde", "ccode": "EU/UK"},
                {"id": 42, "name": "Cayman Islands", "ccode": "EU/UK"},
                {"id": 43, "name": "Central African Republic", "ccode": "EU/UK"},
                {"id": 44, "name": "Chad", "ccode": "EU/UK"},
                {"id": 45, "name": "Chile", "ccode": "AU"},
                {"id": 46, "name": "China", "ccode": "CN"},
                {"id": 47, "name": "Christmas Island", "ccode": "AU"},
                {"id": 48, "name": "Cocos Islands", "ccode": "EU/UK"},
                {"id": 49, "name": "Colombia", "ccode": "AU"},
                {"id": 50, "name": "Comoros", "ccode": "EU/UK"},
                {"id": 51, "name": "Cook Islands", "ccode": "EU/UK"},
                {"id": 52, "name": "Costa Rica", "ccode": "AU"},
                {"id": 53, "name": "Croatia", "ccode": "EU/UK"},
                {"id": 54, "name": "Cuba", "ccode": "AU"},
                {"id": 55, "name": "Curaçao", "ccode": "EU/UK"},
                {"id": 56, "name": "Cyprus", "ccode": "EU/UK"},
                {"id": 57, "name": "Czech Republic", "ccode": "EU/UK"},
                {"id": 58, "name": "Democratic Republic of the Congo", "ccode": "EU/UK"},
                {"id": 59, "name": "Denmark", "ccode": "EU/UK"},
                {"id": 60, "name": "Djibouti", "ccode": "EU/UK"},
                {"id": 61, "name": "Dominica", "ccode": "EU/UK"},
                {"id": 62, "name": "Dominican Republic", "ccode": "EU/UK"},
                {"id": 63, "name": "East Timor", "ccode": "EU/UK"},
                {"id": 64, "name": "Ecuador", "ccode": "AU"},
                {"id": 65, "name": "Egypt", "ccode": "EU/UK"},
                {"id": 66, "name": "El Salvador", "ccode": "AU"},
                {"id": 67, "name": "Equatorial Guinea", "ccode": "EU/UK"},
                {"id": 68, "name": "Eritrea", "ccode": "EU/UK"},
                {"id": 69, "name": "Estonia", "ccode": "EU/UK"},
                {"id": 70, "name": "Ethiopia", "ccode": "EU/UK"},
                {"id": 71, "name": "Falkland Islands", "ccode": "EU/UK"},
                {"id": 72, "name": "Faroe Islands", "ccode": "EU/UK"},
                {"id": 73, "name": "Fiji", "ccode": "EU/UK"},
                {"id": 74, "name": "Finland", "ccode": "EU/UK"},
                {"id": 75, "name": "France", "ccode": "EU/UK"},
                {"id": 76, "name": "French Guiana", "ccode": "EU/UK"},
                {"id": 77, "name": "French Polynesia", "ccode": "EU/UK"},
                {"id": 78, "name": "French Southern Territories", "ccode": "EU/UK"},
                {"id": 79, "name": "Gabon", "ccode": "EU/UK"},
                {"id": 80, "name": "Gambia", "ccode": "EU/UK"},
                {"id": 81, "name": "Georgia", "ccode": "EU/UK"},
                {"id": 82, "name": "Germany", "ccode": "EU/UK"},
                {"id": 83, "name": "Ghana", "ccode": "EU/UK"},
                {"id": 84, "name": "Gibraltar", "ccode": "EU/UK"},
                {"id": 85, "name": "Greece", "ccode": "EU/UK"},
                {"id": 86, "name": "Greenland", "ccode": "EU/UK"},
                {"id": 87, "name": "Grenada", "ccode": "EU/UK"},
                {"id": 88, "name": "Guadeloupe", "ccode": "EU/UK"},
                {"id": 89, "name": "Guam", "ccode": "US/NA"},
                {"id": 90, "name": "Guatemala", "ccode": "AU"},
                {"id": 91, "name": "Guernsey", "ccode": "EU/UK"},
                {"id": 92, "name": "Guinea", "ccode": "EU/UK"},
                {"id": 93, "name": "Guinea-Bissau", "ccode": "EU/UK"},
                {"id": 94, "name": "Guyana", "ccode": "EU/UK"},
                {"id": 95, "name": "Haiti", "ccode": "EU/UK"},
                {"id": 96, "name": "Honduras", "ccode": "AU"},
                {"id": 97, "name": "Hong Kong", "ccode": "HK"},
                {"id": 98, "name": "Hungary", "ccode": "EU/UK"},
                {"id": 99, "name": "Iceland", "ccode": "EU/UK"},
                {"id": 100, "name": "India", "ccode": "IN"},
                {"id": 101, "name": "Indonesia", "ccode": "SG"},
                {"id": 102, "name": "Iran", "ccode": "EU/UK"},
                {"id": 103, "name": "Iraq", "ccode": "EU/UK"},
                {"id": 104, "name": "Ireland", "ccode": "EU/UK"},
                {"id": 105, "name": "Isle of Man", "ccode": "EU/UK"},
                {"id": 106, "name": "Israel", "ccode": "EU"},
                {"id": 107, "name": "Italy", "ccode": "EU/UK"},
                {"id": 108, "name": "Ivory Coast", "ccode": "EU/UK"},
                {"id": 109, "name": "Jamaica", "ccode": "AU"},
                {"id": 110, "name": "Japan", "ccode": "JP"},
                {"id": 111, "name": "Jersey", "ccode": "EU/UK"},
                {"id": 112, "name": "Jordan", "ccode": "EU/UK"},
                {"id": 113, "name": "Kazakhstan", "ccode": "EU/UK"},
                {"id": 114, "name": "Kenya", "ccode": "EU/UK"},
                {"id": 115, "name": "Kiribati", "ccode": "EU/UK"},
                {"id": 116, "name": "Kuwait", "ccode": "EU/UK"},
                {"id": 117, "name": "Kyrgyzstan", "ccode": "RU"},
                {"id": 118, "name": "Laos", "ccode": "SG"},
                {"id": 119, "name": "Latvia", "ccode": "EU/UK"},
                {"id": 120, "name": "Lebanon", "ccode": "EU/UK"},
                {"id": 121, "name": "Lesotho", "ccode": "EU/UK"},
                {"id": 122, "name": "Liberia", "ccode": "EU/UK"},
                {"id": 123, "name": "Libya", "ccode": "EU/UK"},
                {"id": 124, "name": "Liechtenstein", "ccode": "EU/UK"},
                {"id": 125, "name": "Lithuania", "ccode": "EU/UK"},
                {"id": 126, "name": "Luxembourg", "ccode": "EU/UK"},
                {"id": 127, "name": "Macao", "ccode": "CN"},
                {"id": 128, "name": "Macedonia", "ccode": "EU/UK"},
                {"id": 129, "name": "Madagascar", "ccode": "EU/UK"},
                {"id": 130, "name": "Malawi", "ccode": "EU/UK"},
                {"id": 131, "name": "Malaysia", "ccode": "EU/UK"},
                {"id": 132, "name": "Maldives", "ccode": "EU/UK"},
                {"id": 133, "name": "Mali", "ccode": "EU/UK"},
                {"id": 134, "name": "Malta", "ccode": "EU/UK"},
                {"id": 135, "name": "Marshall Islands", "ccode": "US/NA"},
                {"id": 136, "name": "Martinique", "ccode": "EU/UK"},
                {"id": 137, "name": "Mauritania", "ccode": "EU/UK"},
                {"id": 138, "name": "Mauritius", "ccode": "EU/UK"},
                {"id": 139, "name": "Mayotte", "ccode": "EU/UK"},
                {"id": 140, "name": "Mexico", "ccode": "AU"},
                {"id": 141, "name": "Micronesia", "ccode": "EU/UK"},
                {"id": 142, "name": "Moldova", "ccode": "RU"},
                {"id": 143, "name": "Monaco", "ccode": "EU/UK"},
                {"id": 144, "name": "Mongolia", "ccode": "RU"},
                {"id": 145, "name": "Montenegro", "ccode": "EU/UK"},
                {"id": 146, "name": "Montserrat", "ccode": "EU/UK"},
                {"id": 147, "name": "Morocco", "ccode": "EU/UK"},
                {"id": 148, "name": "Mozambique", "ccode": "EU/UK"},
                {"id": 149, "name": "Myanmar", "ccode": "SG"},
                {"id": 150, "name": "Namibia", "ccode": "EU/UK"},
                {"id": 151, "name": "Nauru", "ccode": "AU"},
                {"id": 152, "name": "Nepal", "ccode": "EU/UK"},
                {"id": 153, "name": "Netherlands", "ccode": "EU/UK"},
                {"id": 154, "name": "New Caledonia", "ccode": "EU/UK"},
                {"id": 155, "name": "New Zealand", "ccode": "AU"},
                {"id": 156, "name": "Nicaragua", "ccode": "AU"},
                {"id": 157, "name": "Niger", "ccode": "EU/UK"},
                {"id": 158, "name": "Nigeria", "ccode": "EU/UK"},
                {"id": 159, "name": "Niue", "ccode": "AU"},
                {"id": 160, "name": "Norfolk Island", "ccode": "AU"},
                {"id": 161, "name": "North Korea", "ccode": "EU/UK"},
                {"id": 162, "name": "Northern Mariana Islands", "ccode": "US/NA"},
                {"id": 163, "name": "Norway", "ccode": "EU/UK"},
                {"id": 164, "name": "Oman", "ccode": "EU/UK"},
                {"id": 165, "name": "Pakistan", "ccode": "EU/UK"},
                {"id": 166, "name": "Palau", "ccode": "US/NA"},
                {"id": 167, "name": "Palestinian Territory", "ccode": "EU/UK"},
                {"id": 168, "name": "Panama", "ccode": "AU"},
                {"id": 169, "name": "Papua New Guinea", "ccode": "EU/UK"},
                {"id": 170, "name": "Paraguay", "ccode": "AU"},
                {"id": 171, "name": "Peru", "ccode": "AU"},
                {"id": 172, "name": "Philippines", "ccode": "SG"},
                {"id": 173, "name": "Pitcairn", "ccode": "EU/UK"},
                {"id": 174, "name": "Poland", "ccode": "EU/UK"},
                {"id": 175, "name": "Portugal", "ccode": "EU/UK"},
                {"id": 176, "name": "Puerto Rico", "ccode": "US/NA"},
                {"id": 177, "name": "Qatar", "ccode": "EU/UK"},
                {"id": 178, "name": "Republic of the Congo", "ccode": "EU/UK"},
                {"id": 179, "name": "Reunion", "ccode": "EU/UK"},
                {"id": 180, "name": "Romania", "ccode": "EU/UK"},
                {"id": 181, "name": "Russia", "ccode": "RU"},
                {"id": 182, "name": "Rwanda", "ccode": "EU/UK"},
                {"id": 183, "name": "Saint Barthélemy", "ccode": "AU"},
                {"id": 184, "name": "Saint Helena", "ccode": "EU/UK"},
                {"id": 185, "name": "Saint Kitts and Nevis", "ccode": "AU"},
                {"id": 186, "name": "Saint Lucia", "ccode": "EU/UK"},
                {"id": 187, "name": "Saint Martin", "ccode": "EU/UK"},
                {"id": 188, "name": "Saint Pierre and Miquelon", "ccode": "EU/UK"},
                {"id": 189, "name": "Saint Vincent and the Grenadines", "ccode": "EU/UK"},
                {"id": 190, "name": "Samoa", "ccode": "EU/UK"},
                {"id": 191, "name": "San Marino", "ccode": "EU/UK"},
                {"id": 192, "name": "Sao Tome and Principe", "ccode": "EU/UK"},
                {"id": 193, "name": "Saudi Arabia", "ccode": "EU/UK"},
                {"id": 194, "name": "Senegal", "ccode": "EU/UK"},
                {"id": 195, "name": "Serbia", "ccode": "EU/UK"},
                {"id": 196, "name": "Seychelles", "ccode": "EU/UK"},
                {"id": 197, "name": "Sierra Leone", "ccode": "EU/UK"},
                {"id": 198, "name": "Singapore", "ccode": "SG"},
                {"id": 199, "name": "Sint Maarten", "ccode": "EU/UK"},
                {"id": 200, "name": "Slovakia", "ccode": "EU/UK"},
                {"id": 201, "name": "Solomon Islands", "ccode": "EU/UK"},
                {"id": 202, "name": "Somalia", "ccode": "EU/UK"},
                {"id": 203, "name": "South Africa", "ccode": "EU/UK"},
                {"id": 204, "name": "South Georgia and the South Sandwich Islands", "ccode": "EU/UK"},
                {"id": 205, "name": "South Korea", "ccode": "KR"},
                {"id": 206, "name": "South Sudan", "ccode": "EU/UK"},
                {"id": 207, "name": "Spain", "ccode": "EU/UK"},
                {"id": 208, "name": "Sri Lanka", "ccode": "EU/UK"},
                {"id": 209, "name": "Sudan", "ccode": "EU/UK"},
                {"id": 210, "name": "Suriname", "ccode": "AU"},
                {"id": 211, "name": "Svalbard and Jan Mayen", "ccode": "EU/UK"},
                {"id": 212, "name": "Swaziland", "ccode": "EU/UK"},
                {"id": 213, "name": "Sweden", "ccode": "EU/UK"},
                {"id": 214, "name": "Switzerland", "ccode": "EU/UK"},
                {"id": 215, "name": "Syria", "ccode": "EU/UK"},
                {"id": 216, "name": "Taiwan", "ccode": "US/NA"},
                {"id": 217, "name": "Tajikistan", "ccode": "RU"},
                {"id": 218, "name": "Tanzania", "ccode": "EU/UK"},
                {"id": 219, "name": "Thailand", "ccode": "EU/UK"},
                {"id": 220, "name": "Togo", "ccode": "EU/UK"},
                {"id": 221, "name": "Tokelau", "ccode": "AU"},
                {"id": 222, "name": "Tonga", "ccode": "EU/UK"},
                {"id": 223, "name": "Trinidad and Tobago", "ccode": "EU/UK"},
                {"id": 224, "name": "Tunisia", "ccode": "EU/UK"},
                {"id": 225, "name": "Turkey", "ccode": "EU/UK"},
                {"id": 226, "name": "Turkmenistan", "ccode": "RU"},
                {"id": 227, "name": "Turks and Caicos Islands", "ccode": "EU/UK"},
                {"id": 228, "name": "Tuvalu", "ccode": "EU/UK"},
                {"id": 229, "name": "U.S. Virgin Islands", "ccode": "US/NA"},
                {"id": 230, "name": "Uganda", "ccode": "EU/UK"},
                {"id": 231, "name": "Ukraine", "ccode": "RU"},
                {"id": 232, "name": "United Arab Emirates", "ccode": "EU/UK"},
                {"id": 233, "name": "United Kingdom", "ccode": "EU/UK"},
                {"id": 234, "name": "United States", "ccode": "US/NA"},
                {"id": 235, "name": "United States Minor Outlying Islands", "ccode": "US/NA"},
                {"id": 236, "name": "Universal", "ccode": "DL"},
                {"id": 237, "name": "Uruguay", "ccode": "AU"},
                {"id": 238, "name": "Uzbekistan", "ccode": "RU"},
                {"id": 239, "name": "Vanuatu", "ccode": "EU/UK"},
                {"id": 240, "name": "Vatican", "ccode": "EU/UK"},
                {"id": 241, "name": "Venezuela", "ccode": "AU"},
                {"id": 242, "name": "Vietnam", "ccode": "SG"},
                {"id": 243, "name": "Wallis and Futuna", "ccode": "EU/UK"},
                {"id": 244, "name": "Western Sahara", "ccode": "EU/UK"},
                {"id": 245, "name": "Yemen", "ccode": "EU/UK"},
                {"id": 246, "name": "Zambia", "ccode": "EU/UK"},
                {"id": 247, "name": "Zimbabwe", "ccode": "EU/UK"}]

        }
        this.getTimeZones = function () {
            return [
                {id: 1, name: "(GMT-12:00) International Date Line West"},
                {id: 2, name: "(GMT-11:00) Midway Island", daylight: true},
                {id: 3, name: "(GMT-10:00) Hawaii"},
                {id: 4, name: "(GMT-09:00) Alaska", daylight: true},
                {id: 5, name: "(GMT-08:00) Pacific Time (US & Canada); Tijuana", daylight: true},
                {id: 6, name: "(GMT-07:00) Arizona"},
                {id: 7, name: "(GMT-07:00) Mountain Time (US & Canada)", daylight: true},
                {id: 8, name: "(GMT-07:00) Chihuahua, La Paz, Mazatlan", daylight: true},
                {id: 9, name: "(GMT-06:00) Central America"},
                {id: 10, name: "(GMT-06:00) Central Time (US & Canada)", daylight: true},
                {id: 11, name: "(GMT-06:00) Guadalajara, Mexico City, Monterrey", daylight: true},
                {id: 12, name: "(GMT-06:00) Saskatchewan"},
                {id: 13, name: "(GMT-05:00) Bogota, Lima, Quito"},
                {id: 14, name: "(GMT-05:00) Eastern Time (US & Canada), Indiana(East)", daylight: true},
                {id: 15, name: "(GMT-04:00) Atlantic Time (Canada)", daylight: true},
                {id: 16, name: "(GMT-04:00) Caracas"},
                {id: 17, name: "(GMT-04:00) Georgetown, La Paz"},
                {id: 18, name: "(GMT-04:00) Santiago", daylight: true},
                {id: 19, name: "(GMT-03:30) Newfoundland", daylight: true},
                {id: 20, name: "(GMT-03:00) Brasilia"},
                {id: 21, name: "(GMT-03:00) Buenos Aires"},
                {id: 22, name: "(GMT-03:00) Greenland", daylight: true},
                {id: 23, name: "(GMT-02:00) Noronha South Georgia"},
                {id: 24, name: "(GMT-01:00) Azores", daylight: true},
                {id: 25, name: "(GMT-01:00) Cape Verde Is."},
                {id: 26, name: "(GMT) Casablanca, Monrovia"},
                {id: 27, name: "(GMT) Greenwich Mean Time : Dublin, Edinburgh, Lisbon, London", daylight: true},
                {id: 28, name: "(GMT+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna", daylight: true},
                {id: 29, name: "(GMT+01:00) Belgrade, Bratislava, Budapest, Ljubljana, Prague", daylight: true},
                {id: 30, name: "(GMT+01:00) Brussels, Copenhagen, Madrid, Paris", daylight: true},
                {id: 31, name: "(GMT+01:00) Sarajevo, Skopje, Warsaw, Zagreb", daylight: true},
                {id: 32, name: "(GMT+01:00) West Central Africa"},
                {id: 33, name: "(GMT+02:00) Athens, Istanbul, Minsk", daylight: true},
                {id: 34, name: "(GMT+02:00) Bucharest", daylight: true},
                {id: 35, name: "(GMT+02:00) Cairo", daylight: true},
                {id: 36, name: "(GMT+02:00) Harare, Pretoria, Kaliningrad"},
                {id: 37, name: "(GMT+02:00) Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius", daylight: true},
                {id: 38, name: "(GMT+02:00) Jerusalem"},
                {id: 39, name: "(GMT+03:00) Baghdad, Moscow"},
                {id: 40, name: "(GMT+03:00) Kuwait, Riyadh"},
                {id: 41, name: "(GMT+03:00) Nairobi"},
                {id: 42, name: "(GMT+03:00) Samara, St. Petersburg, Volgograd"},
                {id: 43, name: "(GMT+03:30) Tehran"},
                {id: 44, name: "(GMT+04:00) Abu Dhabi, Muscat"},
                {id: 45, name: "(GMT+04:00) Baku, Tbilisi, Yerevan"},
                {id: 46, name: "(GMT+04:30) Kabul"},
                {id: 47, name: "(GMT+05:00) Ekaterinbrug, Islamabad, Karachi, Tashkent"},
                {id: 48, name: "(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi"},
                {id: 49, name: "(GMT+05:30) Sri Jayawardenepura"},
                {id: 50, name: "(GMT+05:45) Kathmandu"},
                {id: 51, name: "(GMT+06:00) Astana, Almaty, Dhaka, Novosibirsk"},
                {id: 52, name: "(GMT+06:00) Omsk"},
                {id: 53, name: "(GMT+06:30) Rangoon"},
                {id: 54, name: "(GMT+07:00) Krasnoyarsk"},
                {id: 55, name: "(GMT+07:00) Bangkok, Hanoi, Jakarta"},
                {id: 56, name: "(GMT+08:00) Taipei"},
                {id: 57, name: "(GMT+08:00) Beijing, Chongqing, Hong Kong, Urumqi"},
                {id: 58, name: "(GMT+08:00) Kuala Lumpur, Singapore"},
                {id: 59, name: "(GMT+08:00) Irkutsk"},
                {id: 60, name: "(GMT+08:00) Perth"},
                {id: 61, name: "(GMT+08:00) Ulaan Bataar"},
                {id: 62, name: "(GMT+09:00) Yakutsk"},
                {id: 63, name: "(GMT+09:00) Osaka, Sapporo, Tokyo"},
                {id: 64, name: "(GMT+09:00) Seoul"},
                {id: 65, name: "(GMT+09:30) Adelaide", daylight: true},
                {id: 66, name: "(GMT+09:30) Darwin"},
                {id: 67, name: "(GMT+10:00) Vladivostok"},
                {id: 68, name: "(GMT+10:00) Brisbane"},
                {id: 69, name: "(GMT+10:00) Canberra, Melbourne, Sydney", daylight: true},
                {id: 70, name: "(GMT+10:00) Guam, Port Moresby"},
                {id: 71, name: "(GMT+10:00) Hobart", daylight: true},
                {id: 72, name: "(GMT+11:00) Srednekolymsk, Chokurdakh"},
                {id: 73, name: "(GMT+11:00) New Caledonia, Solomon Is., "},
                {id: 74, name: "(GMT+11:00) Magadan", daylight: true},
                {id: 75, name: "(GMT+12:00) Auckland, Wellington", daylight: true},
                {id: 76, name: "(GMT+12:00) Fiji, Kamchatka, Marshall Is., Anadyr"},
                {id: 77, name: "(GMT+13:00) Nuku'alofa"},
                {id: 78, name: "(GMT+13:00) Samoa"},
                {id: 79, name: "(GMT+14:00) Kirimati Island"}
            ]
        }
        this.dateConversion = function (date) {
            if (!date) {
                date = new Date();
                var d = date.getFullYear() + '.' + (date.getMonth() + 1) + '.' + date.getDate();
                return d;
            }
            if (date.indexOf('T') != 10) {
                // 修改格式
                date = new Date(date);
                var d = date.getFullYear() + '.' + (date.getMonth() + 1) + '.' + date.getDate();
                return d;
            }
            date = date.substr(0, date.indexOf('T')).replace(/-/g, ".");
            return date;
        }
        this.pre7Day = function () {
            var date = new Date().setTime(new Date().getTime() - 604800000);
            date = new Date(date);
            var d = date.getFullYear() + '.' + (date.getMonth() + 1) + '.' + date.getDate();
            return d;
        };
        this.dateConversionFromNC = function (date) {
            var date = new Date(NCTime).setTime(new Date(NCTime).getTime());
            date = new Date(date);
            var d = date.getFullYear() + '.' + (date.getMonth() + 1) + '.' + date.getDate();
            return d;
        };
        this.pre7DayFromNC = function (date) {
            var date = new Date(NCTime).setTime(new Date(NCTime).getTime() - 604800000);
            date = new Date(date);
            var d = date.getFullYear() + '.' + (date.getMonth() + 1) + '.' + date.getDate();
            return d;
        };
        this.sortclientRssi = function (nulls, a, b) {
            if (nulls !== null) {
                return nulls;
            } else {
                a = parseInt(a);
                b = parseInt(b);
                if (a === b) {
                    return 0;
                }
                if (a > b) {
                    return 1;
                }
                if (b > a) {
                    return -1;
                }
                return 0;
            }
        }
        this.sortByIP = function (nulls, a, b) {
            function convertToSortIP(ip) {
                if (ip) {
                    let IP = ip.split(".");
                    let sortIP = parseInt(parseInt(IP[0]) * 256 * 256 * 256 + parseInt(IP[1]) * 256 * 256 + parseInt(IP[2]) * 256 + parseInt(IP[3]));
                    return sortIP;
                }
                return 0;
            };
            if (nulls !== null) {
                return nulls;
            } else {
                a = convertToSortIP(a);
                b = convertToSortIP(b);
                if (a === b) {
                    return 0;
                }
                if (a > b) {
                    return 1;
                }
                if (b > a) {
                    return -1;
                }

                return 0;
            }
        }
        this.sortAuthType = function (nulls, a, b) {
            if (nulls !== null) {
                return nulls;
            } else {
                a = TS.ts("configuration.ssid.authType" + a);
                b = TS.ts("configuration.ssid.authType" + b);
                return a.localeCompare(b);
            }
        }

        this.IPKeydown = function ($event) {
            if ($event.ctrlKey && ($event.keyCode == 67 || $event.keyCode == 86)) {
                return;
            }
            if ($event.keyCode == 9) {//tab键屏蔽掉
                return
            }
            var re = /(\.|\d|Backspace)/;
            if (!re.test($event.key)) {
                $event.preventDefault();
            }
        }
        this.setinvalidIP = function () {
            this.invalidIP = {
                ipAddress: false,
                Error: false,
                defaultGateWay: false,
                primaryDNS: false,
                secondDNS: false,
                subnetMask: false
            }
        };
        this.serverRe = /^(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)$/;
        this.subMaskRe = /^(255)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)$/;
        this.gateway = /^(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[0-9]{1,2})(\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[0-9]{1,2})){3}$/;
        this.fileRe = /^(\/?)(([0-9a-zA-Z_-]|\.)\/?)*([0-9a-zA-Z_-]|\.)\.bin$/;
        this.IPKeyup = function (key, org) {
            this.invalidIP[key] = false;
            var verifyRule2 = ['127.0.0.1', '0.0.0.0', '255.255.255.255'];
            if ((verifyRule2.indexOf(org[key]) != -1)) {
                this.invalidIP[key] = true;
                this.invalidIP.Error = true;
            } else {
                if (key == 'subnetMask') {
                    if (!checkMask(org[key])) {
                        this.invalidIP[key] = true;
                        this.invalidIP.Error = true;
                    }
                } else {
                    if (org[key]) {
                        let IP = org[key].split(".");
                        if (IP[3] == 0 || IP[3] == 255 || IP[0] == 127) {
                            this.invalidIP[key] = true;
                            this.invalidIP.Error = true;
                        }
                        if (IP[0] == 0) {
                            this.invalidIP[key] = true;
                            this.invalidIP.Error = true;
                        }
                        if (IP[0] == 169 && IP[1] == 254) {
                            this.invalidIP[key] = true;
                            this.invalidIP.Error = true;
                        }
                    }
                    //檢查IP, A.B.C.D範圍是否為0~255
                    var IPAddressPattern = new RegExp('^((?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))*$');

                    var iPAddress = IPAddressPattern.test(org[key]);
                    if (iPAddress == false) {
                        this.invalidIP[key] = true;
                        this.invalidIP.Error = true;
                    }

                }
                if (!this.invalidIP.primaryDNS && !this.invalidIP.secondDNS && !this.invalidIP.ipAddress && !this.invalidIP.defaultGateWay && !this.invalidIP.subnetMask) {
                    this.invalidIP.Error = false;
                }
            }

        };

        function format(time, format) {
            var t = new Date(time);
            var tf = function (i) {
                return (i < 10 ? '0' : '') + i
            };
            return format.replace(/yyyy|MM|dd|HH|mm|ss/g, function (a) {
                switch (a) {
                    case 'yyyy':
                        return tf(t.getFullYear());
                        break;
                    case 'MM':
                        return tf(t.getMonth() + 1);
                        break;
                    case 'mm':
                        return tf(t.getMinutes());
                        break;
                    case 'dd':
                        return tf(t.getDate());
                        break;
                    case 'HH':
                        return tf(t.getHours());
                        break;
                    case 'ss':
                        return tf(t.getSeconds());
                        break;
                }
            })
        }

        /**
         * 将中国标准时间转换成yyyy-MM-dd HH:mm:ss
         * @param time
         * @param format
         * @returns {*|string}
         */
        this.format = function (time, format) {
            var t = new Date(time);
            var tf = function (i) {
                return (i < 10 ? '0' : '') + i
            };
            return format.replace(/yyyy|MM|dd|HH|mm|ss/g, function (a) {
                switch (a) {
                    case 'yyyy':
                        return tf(t.getFullYear());
                        break;
                    case 'MM':
                        return tf(t.getMonth() + 1);
                        break;
                    case 'mm':
                        return tf(t.getMinutes());
                        break;
                    case 'dd':
                        return tf(t.getDate());
                        break;
                    case 'HH':
                        return tf(t.getHours());
                        break;
                    case 'ss':
                        return tf(t.getSeconds());
                        break;
                }
            })
        }

        function checkMask(mask) {
            var obj = mask;
            if (!obj) return false;
            var exp = /^(254|252|248|240|224|192|128|0)\.0\.0\.0|255\.(254|252|248|240|224|192|128|0)\.0\.0|255\.255\.(254|252|248|240|224|192|128|0)\.0|255\.255\.255\.(254|252|248|240|224|192|128|0)$/;
            var reg = obj.match(exp);
            if (reg == null) {
                return false; //"非法"
            }
            else {
                return true; //"合法"
            }
        }

        this.encryptMethod = function (keyStr, value) {
            var CryptoJS = require("crypto-js");
            if (!keyStr) keyStr = "test";
            var key_str = keyStr.substring(0, 16);
            if (keyStr.length < 16) {
                for (var i = 16; i > keyStr.length; i--) {
                    key_str += "0";
                }
            }
            var key = CryptoJS.enc.Utf8.parse(key_str);
            if (!value) value = '';
            var encryptedData = CryptoJS.AES.encrypt(value, key, {
                mode: CryptoJS.mode.ECB,
                padding: CryptoJS.pad.Pkcs7
            });
            value = encryptedData.ciphertext.toString();
            return value;
        }
        this.decryptMethod = function (keyStr, value) {
            var CryptoJS = require("crypto-js");
            if (!keyStr) keyStr = "test";
            var key_str = keyStr.substring(0, 16);
            if (keyStr.length < 16) {
                for (var i = 16; i > keyStr.length; i--) {
                    key_str += "0";
                }
            }
            var key = CryptoJS.enc.Utf8.parse(key_str);
            if (!value) value = '';
            var encryptedHexStr = CryptoJS.enc.Hex.parse(value);
            var encryptedBase64Str = CryptoJS.enc.Base64.stringify(encryptedHexStr);
            var decryptedData = CryptoJS.AES.decrypt(encryptedBase64Str, key, {
                mode: CryptoJS.mode.ECB,
                padding: CryptoJS.pad.Pkcs7
            });
            try {
                value = decryptedData.toString(CryptoJS.enc.Utf8);
            } catch (e) {
                value = "";
            }

            return value;
        }
        /**
         * @method report模块导出pdf方法提取
         * @param name：模块，result:后台请求的返回
         * @author 李莉红
         * @version
         * */
        this.downloadPDF = function (name, result) {
            var blob = new Blob([result]);
            this.getNodeTime(function () {
                var date = NCTime.replace(/-/g, "").replace(/ /g, "").replace(/:/g, "");
                var fileName = name + date + '.pdf';
                if ('msSaveOrOpenBlob' in navigator) {
                    // Microsoft Edge and Microsoft Internet Explorer 10-11
                    blob = new Blob([result], {type: "application/octet-stream"});
                    window.navigator.msSaveOrOpenBlob(blob, fileName);
                } else {
                    var a = document.getElementById("exportCSVlink");
                    a.download = fileName;
                    a.href = URL.createObjectURL(blob);
                    a.click();
                }
            });
        };

        /**
         * @method 将数据库存的ios时间根据板子的时间转换显示在浏览器里--utils
         * @param ISOTime
         * @author 李莉红
         * @version
         * */
        this.ISOTimeChange = function (ISOTime) {
            if (ISOTime) {
                //将数据库的iso时间转换为跟本系统的时间一样的，显示时区之类的
                var time = ISOTime.replace(/T/g, ' ').replace(/\.[\d]{3}Z/, '');
                time = moment(time).utcOffset(-NCTimeOffset)._d;
                time = format(time, 'yyyy-MM-dd HH:mm:ss');
                //time = moment(time).utcOffset(-NCTimeOffset).format('YYYY-MM-DD HH:mm:ss');
                return time;
            } else {
                return ISOTime;
            }

        };
        /**
         * @method log模块导出csv文件方法提取
         * @param result:后台请求返回的数据
         * @param fileName:下载名字
         * @author 李莉红
         * @version
         * */
        this.exportLogCSV = function (result, fileName) {
            if ('msSaveOrOpenBlob' in navigator) {
                var blob = new Blob([result], {type: "application/octet-stream"});
                // Microsoft Edge and Microsoft Internet Explorer 10-11
                window.navigator.msSaveOrOpenBlob(blob, fileName);
            } else {
                var blob = new Blob(["\ufeff" + result], {type: 'text/csv'}); //解决大文件下载失败
                var a = document.getElementById("exportCSVlink");
                a.download = fileName;
                a.href = URL.createObjectURL(blob);
                a.click();
            }
        };
        /**
         * @method 从后台获取板子的时间，并且设置到全局变量里面
         * -------提取公共方法，每个地方获取时间都是从这里调
         * @param callback
         * @author 李莉红
         * @version
         * */
        this.getNodeTime = function (callback) {            
            NCTime = format(NCTime, 'yyyy/MM/dd HH:mm:ss');//先转换一下时间,
            CommonService.getNodeTime(function (result) {
                if (result.success) {
                    NCTime = result.data.datetime;
                    NCTime = NCTime.replace(/-/g,'/');//解决IOS端页面new Date显示invalid Date的问题,兼容safari
                    NCTime = format(new Date(NCTime), 'yyyy/MM/dd HH:mm:ss');//先转换一下时间,
                    //NCTimeOffset = -480;
                    NCTimeOffset = changeTimeZone(result.data.timeZone.name);
                    //alert(result.data.datetime.replace(" ", "T").replace(/\//g, "-") + "Z");
                    NCISOTime = new Date(new Date(result.data.datetime.replace(" ", "T").replace(/\//g, "-") + "Z").getTime() + NCTimeOffset * 60 * 1000).toISOString();
                    console.log('NCTime:',NCTime,NCISOTime,NCTimeOffset);
                    callback({success: true});
                } else {
                    //NCTime = NCTime || format(new Date(), 'yyyy/MM/dd HH:mm:ss');
                    //NCTimeOffset = NCTimeOffset || new Date().getTimezoneOffset();
                    callback({success: false});
                }
                
            })

        };
        this.changeTimeZone = function (timeZone) {
            //转化成板子的时间显示
            //var timeZone = "(GMT-07:00) International Date Line West";
            var regex1 = /\((.+?)\)/g;
            var a = timeZone.match(regex1)[0];
            var b = a.split("T")[1];
            var c = b.split(":")[0];
            //c<0,在西时区，c>0,在东时区
            if (isNaN(c)) {
                return 0;
            } else {
                return -(parseInt(c) * 60);
            }
        };

        /**
         *将数据库取出来的时间，根据时区设置显示成当前板子上设定的时间
         * ISO时间根据板子显示时区显示时间
         */
        function changeTimeZone(timeZone) {
            //转化成板子的时间显示
            //var timeZone = "(GMT-07:00) International Date Line West";
            var regex1 = /\((.+?)\)/g;
            var a = timeZone.match(regex1)[0];
            var b = a.split("T")[1];
            var c = b.split(":")[0];
            //c<0,在西时区，c>0,在东时区
            if (isNaN(c)) {
                return 0;
            } else {
                return -(parseInt(c) * 60);
            }
        }

        this.calcTimeRange = function (para) {
            //console.log('para:',JSON.stringify(para));
            var fromdate = new Date(para.from);
            var todate = new Date(para.to);

            var from = 0;
            var to = 0;

            let year_B = new Date(NCTime).getFullYear();
            let month_B = new Date(NCTime).getMonth();
            let day_B = new Date(NCTime).getDate();

            //from 计算
            let year_cal_from = fromdate.getUTCFullYear();
            let month_cal_from = fromdate.getUTCMonth();
            let day_cal_from = fromdate.getUTCDate();
            if (typeof para.from == 'object' && para.from.length > 0) {
                // console.log('type',para.from,typeof para.from,new Date(para.from));
                // console.log('NCTimeOffset',NCTimeOffset)
                // fromdate = new Date(fromdate.getTime() - (new Date().getTimezoneOffset())*60*1000);
                year_cal_from = fromdate.getFullYear();
                month_cal_from = fromdate.getMonth();
                day_cal_from = fromdate.getDate();
            }
            // console.log(year_B, month_B, day_B);
            // console.log('from:',year_cal_from, month_cal_from, day_cal_from);

            if (year_B === year_cal_from && month_B === month_cal_from && day_B === day_cal_from) {
                let year_iso = new Date(NCISOTime).getFullYear();
                let month_iso = new Date(NCISOTime).getMonth();
                let day_iso = new Date(NCISOTime).getDate();
                let sel = Date.UTC(year_iso, month_iso, day_iso, 0, 0, 0, 0) + NCTimeOffset * 60 * 1000;
                //console.log('iso_from:',sel)
                from = sel;
            } else {
                let sel = Date.UTC(year_cal_from, month_cal_from, day_cal_from, 0, 0, 0, 0) + NCTimeOffset * 60 * 1000;
                //console.log('selected_from:',sel)
                from = sel;
            }

            //to 计算
            let year_cal_to = todate.getUTCFullYear();
            let month_cal_to = todate.getUTCMonth();
            let day_cal_to = todate.getUTCDate();
            if (typeof para.to == 'object' && para.to.length > 0) {
                year_cal_to = todate.getFullYear();
                month_cal_to = todate.getMonth();
                day_cal_to = todate.getDate();
            }
            // console.log(year_B, month_B, day_B);
            // console.log(year_cal_to, month_cal_to, day_cal_to);

            if (year_B === year_cal_to && month_B === month_cal_to && day_B === day_cal_to) {
                let year_iso = new Date(NCISOTime).getFullYear();
                let month_iso = new Date(NCISOTime).getMonth();
                let day_iso = new Date(NCISOTime).getDate();
                let sel = Date.UTC(year_iso, month_iso, day_iso, 23, 59, 59, 999) + NCTimeOffset * 60 * 1000;
                //console.log('iso_to:',sel)
                to = sel;
            } else {
                let sel = Date.UTC(year_cal_to, month_cal_to, day_cal_to, 23, 59, 59, 999) + NCTimeOffset * 60 * 1000;
                //console.log('selected_to:',sel)
                to = sel;
            }

            // if (fromdate > todate) {
            //     from = todate.setHours(0, 0, 0, 0);
            //     to = fromdate.setHours(23, 59, 59, 0);
            // }

            return {from: from, to: to};
        }

    })
});