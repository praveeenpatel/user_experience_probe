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
async function startVideoCall(hostname, testName, timeOnPage, agentPage, agentBrowser) {
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
        if(event.url.split("?")[0]==="wss://plzwa4.acquire.io/api/v1/crm/ws/visitor/") {
            socketConnect.webSocketCreatedCRM = elapsed_time();
        }
        if(event.url.split("?")[0]==="wss://plzwa4.acquire.io/api/v1/cobrowse/ws/") {
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
    console.log("geerehasd");
    await page.waitFor(2000);
    await page.evaluate(({visitorName})=>{
        const visitorFieldsName = {"name":visitorName};
        window.acquire = window.acquire || [];
        acquire.push({
            fields: {
                contact: visitorFieldsName
            }
        });
        acquire.push(function(app){
            app.max('video');
        });
    },{visitorName});
    await new Promise((res) => {
        setTimeout(res, timeOnPage * 1000)
    });
    await page.waitFor(5000);
    const conversationClick = await agentPage.waitForXPath(
        "//*[@class='virtualization-list-view']/li[1]/div/h3/span[contains(text(), '"+visitorName+"')]"
    );
    await conversationClick.click();
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
    //await agentPage.waitFor(20000);
    await page.waitFor(20000);
    try {
        const endCall = await widgetFrame.waitForXPath("//*[@class='call-control-action']/a[2]");
        await endCall.click();
    }
    catch (e) {
        console.log("error occureddd",e);
    }
    
    const data = await har.stop();
    const testData = {"test":testName,metrics};
    testName && logData(testData);
    agentPage && await agentPage.close();
    page && await page.close();
    agentBrowser && agentBrowser.close();
    browser && browser.close();
    return [200, "ok"];
}
async function startVideoAgent(hostname, timeOnPage, testName, email, password) {
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
        if(event.url.split("?")[0]==="wss://plzwa4.acquire.io/api/v1/crm/ws/visitor/") {
            metrics.webSocketCreatedCRM = elapsed_time();
        }
        if(event.url.split("?")[0]==="wss://plzwa4.acquire.io/api/v1/cobrowse/ws/") {
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
        await page.goto(`https://accounts.acquire.io/login`, {
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
    try {
        await page.waitForSelector(".sidebar__menu-wrapper",{timeout: 300000});
        
    }
    catch(e) {
        console.log("timeout errors");
    }
    let [status, text] = await startVideoCall(hostname,testName,timeOnPage,page,browser);
    //const inner_html = await page.evaluate(() => document.querySelector('.rtc-action').innerHTML);
    //console.log("inner htmls ass",inner_html);
    /*page.evaluate(async ()=>{
        const answerCall = await page.waitForXPath(
            "//*[@class='rtc-action']/a[1]/div"
        );
        console.log("answers",answerCall);
    })*/
    /*setTimeout(async ()=>{
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
    },10000)*/

    /*setTimeout(async () => {
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
    },20000);*/
    
    
    //await launcherFrame.click(".aio-launcher");
    
    
    /*await page.evaluate(()=>{
        window.acquire = window.acquire || [];
        acquire.push((app)=>{
            app.max();
        })
    })*/
    await new Promise((res) => {
        setTimeout(res, timeOnPage * 1000)
    });
    const testData = {"test":testName,metrics};
    testName && logData(testData);
    //visitorPage && (await visitorPage.close());
    //page && (await page.close());
    //visitorBrowser && (await visitorBrowser.close());
    //browser && (await browser.close());
    return [200, "ok",page,browser];
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
    try {
        if (req.query.hostname) {
        let maxPages = req.query.pages || 1;
        for (let i = 0; i < maxPages; i++) {
            const {email,password} = agents[i];
            console.log(email,password);
            let [status, text,page,visitBrowser,visitorName] = await startVideoAgent(req.query.hostname, req.query.pagetime || 5, req.query.testname || null,email,password);
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
        //let [status, text] = await startVideoCall(req.query.hostname, req.query.testname || null, req.query.pagetime || 5,resp.visitorPage,resp.visitorBrowser);
        //if(status >= 200) {
            //await closeConnection(resp.visitorPage, browser);
        //}
        //await closeConnection(pageClose, browser);
        //Object.assign(chat_metrics,socketConnect);
    }
    res.status(resp);
};