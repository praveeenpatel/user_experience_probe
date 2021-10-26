var dockerNames = require("docker-names");
const puppeteer = require("puppeteer");
const PuppeteerHar = require('puppeteer-har');
var fs = require('fs');
var start = process.hrtime();

var elapsed_time = function () {
    var precision = 3;
    var elapsed = process.hrtime(start)[1] / 1000000; // divide by a million to get nano to milli
    start = process.hrtime();
    return parseFloat(elapsed.toFixed(precision));
  }

function logData(data) {
      console.log("final call to log data",data);
      /*var request = require('request');
      var options = {
          'method': 'POST',
          'url': 'http://logs.devops.env.acquire.io/load-time/add',
          'headers': {
          'x-token': '5751f113-97cf-4721-87b5-370178abe7e9',
          'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
      };
      request(options, function (error, response) {
          if (error) throw new Error(error);
          console.log(response.body);
      });*/
}
const PUPPETEER_OPTIONS = {
    headless: false,
    devtools: true, //setting up this will open the developer tools to compare the results with actual api timings
    args: [
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--no-first-run',
      '--no-sandbox',
      '--no-zygote',
      //'--single-process',
      "--proxy-server='direct://'",
      '--proxy-bypass-list=*',
      '--deterministic-fetch',
      '--start-maximized',
      `--use-fake-device-for-media-stream`,
      `--use-fake-ui-for-media-stream`,
      '--allow-file-access-from-files',
      '--use-file-for-fake-video-capture=./test-video.y4m'
    ],
};
//open visitor and agents
async function startAgent(domainname,hostname,timeOnPage,testname,email,password) {
    let {browser} = await openConnection();
    let visitorName = dockerNames.getRandomName(true).replace("_", " ").toUpperCase();
    const page = await browser.newPage();
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36'
    );
    await page.setViewport({ width: 1366,height: 768});
    const client = await page._client;
    const metrics = {};
    client.on('Network.webSocketCreated',(event)=>{
        //console.log("events",event);
        if(event.url.split("?")[0]===`wss://${hostname}/api/v1/crm/ws/visitor/`) {
            metrics.webSocketCreatedCRM = elapsed_time();
        }
        if(event.url.split("?")[0]===`wss://${hostname}/api/v1/cobrowse/ws/`) {
            metrics.webSocketCreatedWebrtc = elapsed_time();
        }
    })
    client.on('Network.webSocketFrameSent', ({requestId, timestamp, response}) => {
        if(response.payloadData.indexOf("scheck") != -1) {
            metrics.cobrowseRequestScheck = elapsed_time();
        }
        if(response.payloadData.indexOf("share") != -1) {
            metrics.cobrowseRequestShare = elapsed_time();
        }
        if(response.payloadData.indexOf("session-switch") != -1) {
            metrics.cobrowseRequestsessionRequest = elapsed_time();
        }
        if(response.payloadData.indexOf("stop-session") != -1) {
            metrics.cobrowseSessionEnd = elapsed_time();
        }
    })
    try {
        await page.goto(`https://${domainname}/login`, {
        timeout: 300000,
        waitUntil: "domcontentloaded",
        });
    } catch (e) {
        return [420, "page load timed out"]
    }
    
    let messageArea = await page.waitForSelector(
        "#usernameOrEmail",
        { visible: true, timeout: 300000 }
    );
    await messageArea.type(email);
    let pwd = await page.waitForSelector(
        "#password",
        { visible: true, timeout: 300000 }
    );
    await pwd.type(password);
    const loginAction = await page.waitForSelector(
        ".form-button",
        { visible: true, timeout: 300000 }
    );
    await loginAction.click();
    return [200,"ok",page,browser];
}
//start visitor session
async function startVisitor(hostname) {
    let visitorName = dockerNames.getRandomName(true).replace("_", " ").toUpperCase();
    const {browser} = await openConnection();
    const page = await browser.newPage();
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36'
    );
    await page.setViewport({ width: 1366,height: 768});
    const client = await page._client;
    const socketConnect = {};
    client.on('Network.webSocketCreated',(event)=>{
        //console.log("events",event);
        if(event.url.split("?")[0]===`wss://${hostname}/api/v1/crm/ws/visitor/`) {
            socketConnect.webSocketCreatedCRM = elapsed_time();
        }
        if(event.url.split("?")[0]===`wss://${hostname}/api/v1/cobrowse/ws/`) {
            socketConnect.webSocketCreatedWebrtc = elapsed_time();
        }
    })
    var timestamp = (Date.now() / 1000 | 0);
    const har = new PuppeteerHar(page);
    await har.start();
    const metrics = {};
    try {
        await page.goto(`https://${hostname}/simulate`, {
        timeout: 300000,
        waitUntil: "domcontentloaded",
        });
    } catch (e) {
        return [420, "page load timed out"]
    }
    try {
        await page.waitForSelector(
        "div.acquire-livechat-widget iframe.aio-launcher-frame",
        { timeout: 2000000 }
        );
        //let elapsed = elapsed_time();
        var elapsed = elapsed_time();
        metrics.widgetload = elapsed;
        console.log(`metrics is : ${JSON.stringify(metrics)}`);
        //testName && logData(testName, elapsed);
    } catch (e) {
        console.log(e)
        return [421, "widget load timed out"]
    }
    const launcherHandle = await page.$(
        "div.acquire-livechat-widget iframe.aio-launcher-frame"
    ).catch((e)=>{console.log(e)});
    const launcherFrame = await launcherHandle.contentFrame();
    try {
        await launcherFrame.waitForSelector(".aio-launcher", { timeout: 200 * 1000 });
    } catch (e) {
        return [422, "widget responsive timed out"]
    }
    let widgetHandle = await page.waitForSelector(
        "div.acquire-livechat-widget div.aio-widget-frame iframe"
    );
    const widgetFrame = await widgetHandle.contentFrame();
    await page.evaluate(({visitorName})=>{
        const visitorFieldsName = {"name":visitorName};
        window.acquire = window.acquire || [];
        acquire.push({
            fields: {
                contact: visitorFieldsName
            }
        });
    },{visitorName});
    try {
        await launcherFrame.waitForSelector(".aio-launcher-status-show", { timeout: 20 * 100 });
        await page.evaluate(()=>{
            window.acquire = window.acquire || [];
            acquire.push(async (app)=>{
               app.max();
            })
        });
        
    } catch (e) {
        launcherFrame.click(".aio-launcher");
        const newconvbtn = await widgetFrame.waitForXPath(
            `//*[@id="conversation-list-wrapper"]/div/div/div[3]/button/div/span[contains(text(), 'New Conversation')]`
        );
        await newconvbtn.click();
    }
    let messageArea = await widgetFrame.waitForSelector(
        ".main-composer.message-input textarea",
        { visible: true, timeout: 300000 }
    );
    console.log("visitor Name as follows",visitorName);
    await messageArea.type(`Hello I am ${visitorName}, and I am a bot`);
    const sendButton = await widgetFrame.waitForSelector(
        ".main-composer-send-button",
        { visible: true, timeout: 300000 }
    );
    await sendButton.click();
    console.log("geerehasd");
    return [200,"ok",page,browser,visitorName,widgetFrame];
}
async function startCobrowsing(agentPage,nameCheck,widgetFrame,visitorPage) {
    try {
        await agentPage.waitForSelector(".sidebar__menu-wrapper",{timeout: 300000});   
    }
    catch(e) {
        console.log("timeout errors");
    }
    try {
        const conversationClick = await agentPage.waitForXPath(
            "//span[contains(text(),'"+nameCheck+"')]",{ visible: true, timeout: 300000 }
        );
        await conversationClick.click();
    }
    catch(e) {
        console.error("Conversation not found");
    }
    const messageAreaComposer = await agentPage.waitForSelector(
        "#composer-modern-editor",
        { visible: true, timeout: 300000 }
    );
    await messageAreaComposer.type(`Hello and I am a bot`);
    const sendButton = await agentPage.waitForSelector(
        "#action-composer-submit",
        { visible: true, timeout: 300000 }
    );
    await sendButton.click();
    //await agentPage.waitFor(5000);
    try {
        const cobrowseClick = await agentPage.waitForXPath(
            `//*[@id="thread-timeline_active"]/div/div[3]/button[2]/span[contains(text(),"Cobrowse")]`
        );
        await cobrowseClick.click();
        await agentPage.$eval('.cobrowse-request-btn', elem => elem.click());
        console.log("elapsed time for cobrowse request to send",elapsed_time());
        try {
            const closeCobrowse = await visitorPage.waitForSelector(".primary",{timeout:30000});
            await closeCobrowse.click();
            elapsed_time();
        }
        catch(e){
            console.log("timeouts",e);
        }

        await visitorPage.waitFor(5000);
        const launcherHandle = await visitorPage.$(
            "div.acq-alert-wrap iframe",{visible:true,timeout:30000}
        ).catch((e)=>{console.log(e)});
        const launcherFrame = await launcherHandle.contentFrame();
        try {
            await launcherFrame.waitForSelector(".buttons",{timeout:20*100});
            const closeCobrowse = await launcherFrame.waitForSelector(".primary");
            await closeCobrowse.click();
            console.log("elapsed time for cobrowse request to accept",elapsed_time());
        }
        catch(e){
            console.log("timeouts",e);
        }
        /*const launcherHandle = await visitorPage.$(
            "div.acq-alert-wrap iframe",{timeout: 30000}
        )
        //const launcherFrame = await launcherHandle.contentFrame();
        try {
            await launcherHandle.waitForSelector(".buttons",{timeout:30000});
            const closeCobrowse = await launcherHandle.waitForSelector(".primary",{timeout:30000});
            await closeCobrowse.click();
            elapsed_time();
        }
        catch(e){
            console.log("timeouts",e);
        }*/
    }
    catch(e) {
        console.log("error occured while requesting cobrowse",e);
    }
    /*const newconvbtn = await widgetFrame.waitForXPath(
        `//*[@class="action-col"]/a[1]`
    );
    await newconvbtn.click();
    console.log("time elapsed call-------",elapsed_time());
    const acceptCall = await agentPage.waitForXPath(
        `//*[@class="incoming-call-action"]/button[contains(text(), 'Answer')]`
    );
    await acceptCall.click();
    console.log("time elapsed to answer------",elapsed_time());
    console.log("call is answeredddddd");*/
    return [200,"ok",widgetFrame];
}
async function startVideoCall(agentPage,nameCheck,widgetFrame) {
    try {
        await agentPage.waitForSelector(".sidebar__menu-wrapper",{timeout: 300000});   
    }
    catch(e) {
        console.log("timeout errors");
    }
    try {
        const conversationClick = await agentPage.waitForXPath(
            "//span[contains(text(),'"+nameCheck+"')]",{ visible: true, timeout: 300000 }
        );
        await conversationClick.click();
    }
    catch(e) {
        console.error("Conversation not found");
    }
    const messageAreaComposer = await agentPage.waitForSelector(
        "#composer-modern-editor",
        { visible: true, timeout: 300000 }
    );
    await messageAreaComposer.type(`Hello and I am a bot`);
    const sendButton = await agentPage.waitForSelector(
        "#action-composer-submit",
        { visible: true, timeout: 300000 }
    );
    await sendButton.click();
    const newconvbtn = await widgetFrame.waitForXPath(
        `//*[@class="action-col"]/a[1]`
    );
    await newconvbtn.click();
    console.log("time elapsed call-------",elapsed_time());
    const acceptCall = await agentPage.waitForXPath(
        `//*[@class="incoming-call-action"]/button[contains(text(), 'Answer')]`
    );
    await acceptCall.click();
    console.log("time elapsed to answer------",elapsed_time());
    console.log("call is answeredddddd");
    return [200,"ok",widgetFrame];
}
async function endCobrowse(page) {
    const cancelBrowse = await page.waitForXPath(
        `//*[@class="address-bar-wrap"]/div/a[4]`
    );
    await cancelBrowse.click();
    const launcherHandle = await page.$(
        "div.acq-alert-wrap iframe"
    ).catch((e)=>{console.log(e)});
    const launcherFrame = await launcherHandle.contentFrame();
    try {
        await launcherFrame.waitForSelector(".buttons",{timeout:20*100});
        const closeCobrowse = await launcherFrame.waitForSelector(".primary");
        await closeCobrowse.click();
    }
    catch(e){
        console.log("timeouts",e);
    }
    return [200];
}
async function endCalls(widgetFrame) {
    const endCall = await widgetFrame.waitForXPath(
        `//*[@class="call-control-action"]/a[2]`
    );
    await endCall.click();
    console.log("end call successfull");
    return [200];
}
const openConnection = async () => {
    const browser = await puppeteer.launch(PUPPETEER_OPTIONS);
    
    
    // Start the HTTP Tracing
    //await har.start({ path: './'+timestamp+'results.har' });
    
    return { browser };
};
exports.openVisitor = async (req, res) => {
    //let { browser } = await openConnection();
    let resp = {
        status: 200,
        text: 'ok',
        visitorName: null,
        visitorPage: null,
        //visitorBrowser: browser
    };
    let chat_metrics = {};
    let pageClose = null;
    const agents = req.query.creds;
    const closeConnection = {"widgetFrames":[],"agentPages":[],"visitorPages":[],"agentBrowsers":[],"visitorBrowsers":[]};
    try {
        if (req.query.hostname) {
        let maxPages = req.query.pages || 1;
        for (let i = 0; i < maxPages; i++) {
            const {email,password} = agents[i];
            console.log(email,password);
            let [status, text,agentPage,agentBrowser] = await startAgent(req.query.domainname,req.query.hostname, req.query.pagetime || 5, req.query.testname || null,email,password);
            let [visStatus, visText,visitorPage,visitorBrowser,nameCheck,widgetFrame] = await startVisitor(req.query.hostname);
            if(status>=200 && visStatus>=200 && i%2==0) {
                let [callStatus,callText] = await startCobrowsing(agentPage,nameCheck,widgetFrame,visitorPage);
                if(callStatus >= 200) {
                    await widgetFrame.waitFor(10000);
                    closeConnection.widgetFrames.push(widgetFrame);
                    closeConnection.agentPages.push(agentPage);
                    closeConnection.agentBrowsers.push(agentBrowser);
                    closeConnection.visitorPages.push(visitorPage);
                    closeConnection.visitorBrowsers.push(visitorBrowser);
                }
            }
            else {
                let [callStatus,callText] = await startVideoCall(agentPage,nameCheck,widgetFrame);
                if(callStatus >= 200) {
                    await widgetFrame.waitFor(10000);
                    closeConnection.widgetFrames.push(widgetFrame);
                    closeConnection.agentPages.push(agentPage);
                    closeConnection.agentBrowsers.push(agentBrowser);
                    closeConnection.visitorPages.push(visitorPage);
                    closeConnection.visitorBrowsers.push(visitorBrowser);
                }
            }
        }
        const frames = closeConnection.agentPages;
        if(frames.length === maxPages) {
            for(let i=0;i<frames.length;i++) {
                if(i%2==0) {
                    let [endCallStatus] = await endCobrowse(frames[i]);
                    if(endCallStatus >= 200) {
                        closeConnection.agentPages[i] && await closeConnection.agentPages[i].close();
                        closeConnection.visitorPages[i] && await closeConnection.visitorPages[i].close();
                        closeConnection.agentBrowsers[i] && await closeConnection.agentBrowsers[i].close();
                        closeConnection.visitorBrowsers[i] && await closeConnection.visitorBrowsers[i].close();
                    }
                }
                else {
                    let [endCallStatus] = await endCalls(closeConnection.widgetFrames[i]);
                    if(endCallStatus >= 200) {
                        closeConnection.agentPages[i] && await closeConnection.agentPages[i].close();
                        closeConnection.visitorPages[i] && await closeConnection.visitorPages[i].close();
                        closeConnection.agentBrowsers[i] && await closeConnection.agentBrowsers[i].close();
                        closeConnection.visitorBrowsers[i] && await closeConnection.visitorBrowsers[i].close();
                    }
                }
            }
        }
        }
        else {
            throw new Error('No hostname');
        }
    } catch (err) {
        if (resp.status == 200) {
        resp.status = 499;
        resp.text = "unkown error";
        }
    console.log(err);
    } finally {
    }
    res.status(resp);
};