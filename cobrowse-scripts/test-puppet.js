let { openVisitor, openAgent } = require('./agent-login-cobrowse');
openVisitor({
    query:{
        hostname: "plzwa4.acquire.io",
        testname: "test-agent-login-cobrowse",
        username:"viswanath.sarma@acquire.io",
        password:"Acquire@2020"
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
