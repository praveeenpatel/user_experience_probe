let { openVisitor, openAgent } = require('./video-call-test');
openVisitor({
	query:{
        domainname:"accounts.kube.env.acquire.io",
        hostname: "lybcmo.kube.env.acquire.io",
        testname: "test-simulate-passive-browsing",
        pages: 1,
        creds: [
            // {"email":"viswanath.sarma@acquire.io","password":"Acquire@2020"},
            // {"email":"operator2@viswanath.com","password":"Acquire@2020"},
            // {"email":"operator3@viswanath.com","password":"Acquire@2020"},
            // {"email":"operator4@viswanath.com","password":"Acquire@2020"},
            // {"email":"operator5@viswanath.com","password":"Acquire@2020"},
            // {"email":"operator6@viswanath.com","password":"Acquire@2020"},
            // {"email":"operator7@viswanath.com","password":"Acquire@2020"},
            // {"email":"operator8@viswanath.com","password":"Acquire@2020"},
            // {"email":"operator9@viswanath.com","password":"Acquire@2020"},
            // {"email":"operator10@viswanath.com","password":"Acquire@2020"},
            // {"email":"operator11@viswanath.com","password":"Acquire@2020"},
            // {"email":"operator12@viswanath.com","password":"Acquire@2020"},
            // {"email":"operator13@viswanath.com","password":"Acquire@2020"},
            // {"email":"operator14@viswanath.com","password":"Acquire@2020"},
            // {"email":"operator15@viswanath.com","password":"Acquire@2020"},
            // {"email":"operator16@viswanath.com","password":"Acquire@2020"},
            // {"email":"operator17@viswanath.com","password":"Acquire@2020"},
            // {"email":"operator18@viswanath.com","password":"Acquire@2020"},
            // {"email":"operator19@viswanath.com","password":"Acquire@2020"},
            // {"email":"operator20@viswanath.com","password":"Acquire@2020"},
            // {"email":"operator21@viswanath.com","password":"Acquire@2020"},
            // {"email":"operator22@viswanath.com","password":"Acquire@2020"},
            // {"email":"operator23@viswanath.com","password":"Acquire@2020"},
            // {"email":"operator24@viswanath.com","password":"Acquire@2020"},
            // {"email":"operator25@viswanath.com","password":"Acquire@2020"},
            // {"email":"operator26@viswanath.com","password":"Acquire@2020"},
            // {"email":"operator27@viswanath.com","password":"Acquire@2020"},
            // {"email":"operator28@viswanath.com","password":"Acquire@2020"},
            // {"email":"operator29@viswanath.com","password":"Acquire@2020"},
            // {"email":"operator30@viswanath.com","password":"Acquire@2020"},
            //{"email":"test5@acquire.io","password":"Acquire@2020"}
            {"email":"pavan.tanguturi@acquire.io","password":"Abc@123"}
        ]
    }
    /*query:{
        hostname: "ksczsa.acquire.io",
        testname: "test-simulate-passive-browsing",
        pages: 20,
        creds: [
            {"email":"operator1@acquire.io","password":"Acquire@2020"},
            {"email":"operator2@acquire.io","password":"Acquire@2020"},
            {"email":"operator3@acquire.io","password":"Acquire@2020"},
            {"email":"operator4@acquire.io","password":"Acquire@2020"},
            {"email":"operator5@acquire.io","password":"Acquire@2020"},
            {"email":"operator6@acquire.io","password":"Acquire@2020"},
            {"email":"operator7@acquire.io","password":"Acquire@2020"},
            {"email":"operator8@acquire.io","password":"Acquire@2020"},
            {"email":"operator9@acquire.io","password":"Acquire@2020"},
            {"email":"operator10@acquire.io","password":"Acquire@2020"},
            {"email":"operator11@acquire.io","password":"Acquire@2020"},
            {"email":"operator12@acquire.io","password":"Acquire@2020"},
            {"email":"operator13@acquire.io","password":"Acquire@2020"},
            {"email":"operator14@acquire.io","password":"Acquire@2020"},
            {"email":"operator15@acquire.io","password":"Acquire@2020"},
            {"email":"operator16@acquire.io","password":"Acquire@2020"},
            {"email":"operator17@acquire.io","password":"Acquire@2020"},
            {"email":"operator18@acquire.io","password":"Acquire@2020"},
            {"email":"operator19@acquire.io","password":"Acquire@2020"},
            {"email":"operator20@acquire.io","password":"Acquire@2020"},
            //{"email":"test5@acquire.io","password":"Acquire@2020"}
        ]
    }*/
},{
    status:function(){
        return {
            send: function(){return}
        }
    }
    /*status: function(resp){
        openAgent({
            query:{
                hostname: "plzwa4.acquire.io",
                testname: "test-simulate-passive-browsing",
                visitorNameCheck: resp.visitorName,
                visitorPage: resp.visitorPage
            }
        },{
            status:function(){
                return {
                    send: function(){return}
                }
            }
        })
    }*/
})
