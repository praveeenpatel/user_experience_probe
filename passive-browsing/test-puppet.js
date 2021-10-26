let { openVisitor } = require('./passive-browsing-widget');
openVisitor({
    query:{
        hostname: "plzwa4.acquire.io",
        testname: "test-simulate-passive-browsing"
    }
},{
    status: function(){
        return {
            send: function(){return}
        }
    }
})
