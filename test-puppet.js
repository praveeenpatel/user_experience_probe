const args = process.argv.slice(2);
if(args[0] === "chats-load") {
    let { openVisitor } = require('./chat-loads/chat-loads-widget');
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
}
else if(args[0] === "passive-browsing") {
    let { openVisitor } = require('./passive-browsing/passive-browsing-widget');
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
}
