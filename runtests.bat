cd source\msteams-app-questionly.data 
call npm.cmd run ci-test

cd .\..\msteams-app-questionly.common
call npm.cmd run ci-test

cd .\..\msteams-app-questionly.func
call npm.cmd run ci-test

cd .\..\msteams-app-questionly
call npm.cmd run ci-test