define(["serviceModule"], function (services) {

    services.service("LanguageService", function () {
    	this.getPageLanguage=function(){
            return  language = 
                    {   
                  
                    alert:[
                      {
                        key:'Confirm',
                        cn :'确定',
                        en :'Confirm',
                        tw :'確認',
                        es :'Determinar',
                        kr :'확인',
                        it :'Confermare',
                        de :'Bestätigen'
                      },
                      {
                        key:'TimeOut',
                        cn :'登录超时，请重新登录!',
                        en :'Login timeout, please log in again！',
                        tw :'登入超時，請再次登入！',
                        es :'Gracias por tu comentario!',
                        kr :'로그인 시간이 초과되었습니다. 다시 로그인하십시오!',
                        it :'Accesso scaduto, accedi nuovamente!',
                        de :'Zeitüberschreitung'
                      },
                      {
                        key:'InvalidDateRange',
                        cn :'无效的时间范围!',
                        en :'Invalid day range!',
                        tw :'無效日範圍！',
                        es :'Plazo de nulidad!',
                        kr :'시간대가 잘못되었습니다!',
                        it :'Intervallo di tempo non valido!',
                        de :'Ungültiger Zeitraum!'
                      },
                      {
                        key:'IPError',
                        cn :'IP地址不合法!',
                        en :'This IP address is not legal!',
                        tw :'這個IP地址是不合法的!',
                        es :'¡La dirección IP no es legal!',
                        kr :'IP 주소가 유효하지 않습니다!',
                        it :'L`indirizzo IP non è legale!',
                        de :'IP-Adresse ist illegal'
                      },
                      {
                        key:'MACError',
                        cn :'MAC地址不合法!',
                        en :'This MAC address is not legal!',
                        tw :'這個MAC地址是不合法的!',
                        es :'¡La Dirección MAC es ilegal!',
                        kr :'MAC 주소는 유효하지 않습니다!',
                        it :'L`indirizzo MAC non è legale!',
                        de :''
                      },
                      {
                        key:'UserError',
                        cn :'请登录到您的帐户!',
                        en :'Please login to your account!',
                        tw :'請登入到您的帳戶!',
                        es :'¡A su cuenta, por favor!',
                        kr :'귀하의 계정에 로그인하십시오!',
                        it :'Per favore accedi al tuo account!',
                        de :''
                      }
                    ],
                   dashboard:{
                      Diagrams:[
                       {
                          key:'LastHourTitle',
                          cn :'最近一小时的信息',
                          en :'Last Hour Diagrams',
                          tw :'前一小時的資訊'
                       },
                       {
                          key:'lastHourNumberChartsTitle',
                          cn :'最近一小时的终端数.可查询7天内数据',
                          en :'Number of Clients in the Last Hour vs Number of Clie\nnts in the Past 7 Days',
                          tw :'前一小時連線的用戶端數量 vs. 過去七天連線的用戶端數量'
                        },
                        {
                          key:'lastHourTrafficChartsTitle',
                          cn :'最近一小时的数据流量.查询7天内数据',
                          en :'Traffic Usage in the Last Hour vs Traffic Usage in the Pa\nst 7 Days',
                          cht :'前一小時的網路流量 vs. 過去七天的網路流量'
                        },
                        {
                          key :'lastHourTrafficDownUpChartsTitle',
                          cn  :'最近一小时内下行/上行流量',
                          en  :'Downlink/Uplink Traffic Usage Structure in the Last Ho\nur(KB)',
                          cht :'前一小時下載/上傳流量架構'
                        },
                        {
                          key :'lastHourTrafficSsidChartsTitle',
                          cn  :'最近一小时内基于SSID数据流量',
                          en  :'Traffic Usage Structure by SSID in the Last Hour(KB)',
                          cht :'依SSID區分前一小時網路流量'
                        },
                        {
                          key:'hotTimeTitle',
                          cn :'热点时间',
                          en :'Hot Time',
                          cht :'最高網路活動'
                        },
                        {
                          key:'MostClientsHotTimeChartsTitle',
                          cn :'过去7天客户端高峰统计',
                          en :'Most Clients Hot Time According Past 7 Days Experien\nce',
                          cht :'過去七天尖峰時段最多用戶連線數'
                        },
                        {
                          key:'MostTrafficUsageChartsTitle',
                          cn :'过去7天流量使用高峰统计',
                          en :'Most Traffic Usage Hot Time According Past 7 Days Exp\nerience',
                          cht :'過去七天尖峰時段最大流量'
                        },
                        {
                          key:'hotAPTitle',
                          cn :'无线接入热点',
                          en :'Hot AP',
                          cht :'無線AP'
                        },
                        {
                          key:'hotAPMapTitle',
                          cn :'无线接入热点地图',
                          en :'Hot AP Map of Network',
                          cht :'無線AP地圖'
                        },
                        {
                          key:'hotHourlyTitle',
                          cn :'每小时热点',
                          en :'Hot Hourly',
                          cht :'每小時網路活動'
                        },
                        {
                          key:'HourlyUniqueChartsTitle',
                          cn :'过去7天客户端小时统计',
                          en :'Hourly Unique Clients vs Past 7 Days Experiences',
                          cht :'每小時獨特用戶 vs. 過去七天經驗'
                        },
                        {
                          key:'HourlyTrafficChartsTitle',
                          cn :'过去7天流量使用小时统计',
                          en :'Hourly Traffic Usage vs Past 7 Days Experiences',
                          cht :'每小時流量 vs. 過去七天經驗'
                        },
                        {
                          key:'DailyTitle',
                          cn :'每日',
                          en :'Daily',
                          cht :'每日網路活動'
                        },
                        {
                          key:'DailyTrafficUsageChartsTitle',
                          cn :'客户端每日流量统计',
                          en :'Daily Traffic Usage VS Unique Clients',
                          cht :'每日流量 vs. 獨特用戶'
                        },
                     ] 
                   }
                };
    	}
    })
})