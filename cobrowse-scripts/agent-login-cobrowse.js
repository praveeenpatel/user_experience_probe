var dockerNames = require("docker-names");
const puppeteer = require("puppeteer");
const PuppeteerHar = require('puppeteer-har');
var fs = require('fs');
var start = process.hrtime();
var elapsed_time = function () {
  var precision = 3; // 3 decimal places
  var elapsed = process.hrtime(start)[1] / 1000000; // divide by a million to get nano to milli
  // console.log(process.hrtime(start)[0] + " s, " + elapsed.toFixed(precision) + " ms - " + note); // print message + time
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
    '--single-process',
    "--proxy-server='direct://'",
    '--proxy-bypass-list=*',
    '--deterministic-fetch',
    '--start-maximized'
  ],
};
async function startChat(hostname, browser, timeOnPage, testName) {
    let visitorName = dockerNames.getRandomName(true).replace("_", " ").toUpperCase();
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
    await messageArea.type(`Hello I am ${visitorName}, and I am a bot`);
    const sendButton = await widgetFrame.waitForSelector(
        ".main-composer-send-button",
        { visible: true, timeout: 300000 }
    );
    await sendButton.click();
    
    //await launcherFrame.click(".aio-launcher");
    
    
    /*await page.evaluate(()=>{
        window.acquire = window.acquire || [];
        acquire.push((app)=>{
            app.max();
        })
    })*/
    /*await page.waitForSelector(".cobrowsing-secure-border");
    await page.waitFor(10000);
    const cobrowseClose = await page.waitForSelector(".tgCobClose");
    await cobrowseClose.click();*/
    await new Promise((res) => {
        setTimeout(res, timeOnPage * 1000)
    });
    const data = await har.stop();
    //const data = fs.readFileSync(har.path);
    //const jsonContents = JSON.parse(data);
    for(let reqObj of data.log.entries) {
        const req = reqObj;
        const reqUrl = req.request.url;
            /*switch (reqUrl) {
                case "https://${hostname}/simulate" : metrics.pageload = req.time;
                case "https://${hostname}/api/v1/crm/messenger/visitor/init?-x-user-type=contact" : metrics.initload = req.time;
                case "https://${hostname}/api/v1/crm/messenger/chat/add-message?-x-user-type=contact" : metrics.addMessageLoad = req.time;
                case "https://${hostname}/api/v1/crm/messenger/chat/create?-x-user-type=contact" : metrics.createChatLoad = metrics.addMessageLoad + req.time;
                default : console.log("no matches----"); break;
            }*/
        if(req && req.request && req.request.url && req.request.url === `https://${hostname}/simulate`) {
            metrics.pageload = req.time;
        }
        if(req && req.request && req.request.url && req.request.url === "https://${hostname}/api/v1/crm/messenger/visitor/init?-x-user-type=contact") {
            metrics.initload = req.time;
        }
        if(req && req.request && req.request.url && req.request.url === "https://${hostname}/api/v1/crm/messenger/chat/add-message?-x-user-type=contact") {
            metrics.addMessageLoad = req.time;
        } 
        if(req && req.request && req.request.url && req.request.url === "https://${hostname}/api/v1/crm/messenger/chat/create?-x-user-type=contact") {
            metrics.createChatLoad = metrics.addMessageLoad + req.time;
        }
    }
        //form integration to start conversation with the form,,
        /*let nameField = await widgetFrame.waitForSelector(`[id^="form-contact.name-"]`);
        await nameField.type(visitorName);
        const startconvbtn = await widgetFrame.waitForXPath(
          `//*[@id="new-thread-wrapper"]/div/div/div/div[2]/button/div/span[contains(text(), 'Start Conversation')]`
        );
        await startconvbtn.click();*/
    
    //setTimeout(async () => {
        
    //},50000);
    const testData = {"test":testName,metrics};
    testName && logData(testData);
    return [200, "ok",page,browser,visitorName];
}
async function startCobrowsing(hostname, timeOnPage, testName,visitorPage,nameToCheck, username, password) {
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
        await page.goto(`https://${hostname}/`, {
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
    await messageArea.type(`${username}`);
    let pwd = await page.waitForSelector(
        "#password",
        { visible: true, timeout: 300000 }
    );
    await pwd.type(`${password}`);
    const loginAction = await page.waitForSelector(
        ".form-button",
        { visible: true, timeout: 300000 }
    );
    await loginAction.click();
    try {
        await page.waitForSelector(".sidebar__menu-wrapper",{timeout: 300000});
        
    }
    catch(e) {
        console.log("timeout errors");
    }

    await page.waitFor(5000);

    const conversationClick = await page.waitForXPath(
        "//*[@class='virtualization-list-view']/li[1]/div/h3/span[contains(text(), '"+nameToCheck+"')]"
    );
    await conversationClick.click();
    const messageAreaComposer = await page.waitForSelector(
        "#composer-modern-editor",
        { visible: true, timeout: 300000 }
    );
    await messageAreaComposer.type(`Hello and I am a bot`);
    const sendButton = await page.waitForSelector(
        "#action-composer-submit",
        { visible: true, timeout: 300000 }
    );
    await sendButton.click();
    
    const cobrowseClick = await page.waitForXPath(
        `//*[@id="thread-timeline_active"]/div/div[3]/button[2]/span[contains(text(),"Cobrowse")]`
    );
    await cobrowseClick.click();
    //const searchBtn =  await page.$x("//input[@name='cobrowse-request-btn']");
    //await searchBtn[0].click();
    const inner_html = await page.evaluate(() => document.querySelector('.wrap-btn').innerHTML);
    setTimeout(async ()=>{
        const requestCobrowse = await page.waitForSelector(
            `.cobrowse-request-btn`,
            { visible: true, timeout: 300000 }
        );
        await requestCobrowse.click();
        elapsed_time();
    },2000);

    setTimeout(async ()=>{
        const launcherHandle = await visitorPage.$(
            "div.acq-alert-wrap iframe",{timeout: 30000}
        )
        const launcherFrame = await launcherHandle.contentFrame();
        try {
            await launcherFrame.waitForSelector(".buttons",{timeout:30000});
            const closeCobrowse = await launcherFrame.waitForSelector(".primary",{timeout:30000});
            await closeCobrowse.click();
            elapsed_time();
        }
        catch(e){
            console.log("timeouts",e);
        }
    },10000)

    setTimeout(async () => {
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
    },20000);
    
    
    //await launcherFrame.click(".aio-launcher");
    
    
    /*await page.evaluate(()=>{
        window.acquire = window.acquire || [];
        acquire.push((app)=>{
            app.max();
        })
    })*/
    
    await new Promise((res) => {
        setTimeout(res, timeOnPage * 5000)
    });
    await new Promise((res) => {
        setTimeout(res, timeOnPage * 1000)
    });
    const testData = {"test":testName,metrics};
    testName && logData(testData);
    //visitorPage && (await visitorPage.close());
    page && (await page.close());
    //visitorBrowser && (await visitorBrowser.close());
    browser && (await browser.close());
    return [200, "ok"]
}
const openConnection = async () => {
    const browser = await puppeteer.launch(PUPPETEER_OPTIONS);
    
    
    // Start the HTTP Tracing
    //await har.start({ path: './'+timestamp+'results.har' });
    
    return { browser };
};
const closeConnection = async (page, browser, har) => {
    //await har.stop();
    page && (await page.close());
    browser && (await browser.close());
};
//agent session
/*exports.openAgent = async (req, res) => {
    let { browser } = await openConnection();
    let resp = {
        status: 200,
        text: 'ok'
    };
    let chat_metrics = {};
    let pageClose = null;
    try {
        if (req.query.hostname) {
        let maxPages = req.query.pages || 1;
        for (let i = 0; i < maxPages; i++) {
            let [status, text,page] = await startCobrowsing(req.query.hostname, browser, req.query.pagetime || 5, req.query.testname || null, req.query.visitorNameCheck,req.query.visitorPage,req.query.visitorBrowser);
            if (status >= 200) {
                resp.status = status;
                resp.text = text;
                //chat_metrics[`page-${i}`] = metrics;
                pageClose = page
                //throw new Error(text);
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
        //await closeConnection(pageClose, browser);
        //Object.assign(chat_metrics,socketConnect);
    }
    res.status(resp.status).send(resp.text);
};*/
//visitor session
exports.openVisitor = async (req, res) => {
    let { browser } = await openConnection();
    let resp = {
        status: 200,
        text: 'ok',
        visitorName: null,
        visitorPage: null,
        //visitorBrowser: browser
    };
    let chat_metrics = {};
    let pageClose = null;
    try {
        if (req.query.hostname) {
        let maxPages = req.query.pages || 1;
        for (let i = 0; i < maxPages; i++) {
            let [status, text,page,visitBrowser,visitorName] = await startChat(req.query.hostname, browser, req.query.pagetime || 5, req.query.testname || null);
            if (status >= 200) {
                resp.status = status;
                resp.text = text;
                //chat_metrics[`page-${i}`] = metrics;
                resp.visitorPage = page;
                resp.visitorBrowser = visitBrowser;
                resp.visitorName = visitorName;
                //throw new Error(text);
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
        let [status, text] = await startCobrowsing(req.query.hostname, req.query.pagetime || 5, req.query.testname || null,resp.visitorPage,resp.visitorName, req.query.username,req.query.password);
        if(status >= 200) {
            await closeConnection(resp.visitorPage, browser);
        }
        //await closeConnection(pageClose, browser);
        //Object.assign(chat_metrics,socketConnect);
    }
    res.status(resp);
};