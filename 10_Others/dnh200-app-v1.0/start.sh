#!/usr/bin/env bash
#SHELL_FOLDER=$(cd "$(dirname "$0")";pwd)
#start_time=`date +%Y%m%d%H%M`
if [[ ! -d "/userdata/config" ]]
then
	mkdir "/userdata/config"
fi
if [[ ! -d "/userdata/log" ]]
then
	mkdir "/userdata/log"
fi
check_watcher=`ps |grep watcher | grep -v grep | wc -l`
if [ $check_watcher -lt 1 ]
then
	chmod -R 777 watcher
	nohup ./watcher >/dev/null 2>&1 &
fi
sleep 10
chmod -R 777 nuclias-media
#nohup ./nuclias-media >"/userdata/log/CS_"$start_time".log" 2>&1 &
nohup ./nuclias-media >/dev/null 2>&1 &
if [ $? -ne 0 ]
then
	echo -e "\033[31mERROR\033[0m: Start the Nuclias Connect core service failed, Please make sure that the environment there is no problem."
	exit 1
fi
sleep 2
chmod -R 777 nuclias-web
#nohup ./nuclias-web >"/userdata/log/WS_"$start_time".log" 2>&1 &
nohup ./nuclias-web >/dev/null 2>&1 &
if [ $? -eq 0 ]
then
	echo "Nuclias Connect services are running..."
else
	echo -e "\033[31mERROR\033[0m: Start the Nuclias Connect web service failed, Please make sure that the environment there is no problem."
	exit 1
fi
exit 0




