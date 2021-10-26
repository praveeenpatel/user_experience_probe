let { openVisitor } = require('./cobrowse-tests-v2');
openVisitor({
    query:{
        domainname:"accounts.acquire.io",
        hostname: "plzwa4.acquire.io",
        testname: "test-simulate-passive-browsing",
        pages: 1,
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
            {"email":"test5@acquire.io","password":"Acquire@2020"}
        ]
    }
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
