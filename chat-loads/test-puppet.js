let { openVisitor } = require('./chat-loads-widget');
openVisitor({
    query:{
        hostname: "63rplm.acquire.io",
        testname: "test-simulate-chat-loads",
        pages:1
    }
}, {
    status: function () {
        console.log("Completed");
	process.exit(); 
        return {
            send: function () { return }
        }
    }
})
