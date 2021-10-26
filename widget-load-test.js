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
async function startChat(hostname, browser, page, timeOnPage, testName, har) {
    let visitorName = dockerNames.getRandomName(true).replace("_", " ").toUpperCase();
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
        console.log("finfished elapsed times",elapsed);
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
    await page.evaluate(()=>{
        window.acquire = window.acquire || [];
        acquire.push((app)=>{
            app.max();
        });
    })
    let widgetHandle = await page.waitForSelector(
        "div.acquire-livechat-widget div.aio-widget-frame iframe"
    );
    const widgetFrame = await widgetHandle.contentFrame();
    /*const newconvbtn = await widgetFrame.waitForXPath(
        `//*[@id="conversation-list-wrapper"]/div/div/div[3]/button/div/span[contains(text(), 'New Conversation')]`
    );
    await newconvbtn.click();*/
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
    //form integration to start conversation with the form,,
    let nameField = await widgetFrame.waitForSelector(`[id^="form-contact.name-"]`);
    await nameField.type(visitorName);
    const startconvbtn = await widgetFrame.waitForXPath(
      `//*[@id="new-thread-wrapper"]/div/div/div/div[2]/button/div/span[contains(text(), 'Start Conversation')]`
    );
    await startconvbtn.click();
    /*try {
        debugger;
        await widgetFrame.waitForSelector(".main-conversation-footer.aio_loading", {visible:true, timeout: 200 * 1000 });
    } catch (e) {
        console.log("yes times out of loading")
        return [422, "loader timed out"]
    }*/
    /*let loaderComp = await widgetFrame.waitForSelector(".main-conversation-footer.aio_loading",{visible:true,timeout:300000});
    const waitForMessageArea = await widgetFrame.waitForSelector(".main-composer.message-input textarea",{ visible: true, timeout: 300000 });
    await waitForMessageArea.type(`Hello I am ${visitorName}, and I am a bot`);
    const sendButton1 = await widgetFrame.waitForSelector(
        ".main-composer-send-button",
        { visible: true, timeout: 300000 }
    );
    await sendButton1.click();
    console.log(`${visitorName} sent`);*/
    /*setTimeout(async ()=>{
        const waitForMessageArea = await widgetFrame.waitForSelector(".main-composer.message-input textarea",{ visible: true, timeout: 300000 });
        await waitForMessageArea.type(`Hello I am ${visitorName}, and I am a bot`);
        const sendButton1 = await widgetFrame.waitForSelector(
            ".main-composer-send-button",
            { visible: true, timeout: 300000 }
        );
        await sendButton1.click();
        console.log(`${visitorName} sent`);
        
    },3000);*/
    
    /*await widgetFrame.waitForSelector(".aio_loading",{visible: true, timeout: 300000});
    let messageArea2 = await widgetFrame.waitForSelector(
        ".main-composer.message-input textarea",
        { visible: true, timeout: 300000 }
    );
    await messageArea2.type(`Hello I am ${visitorName}, and I am a bot`);
    const sendButton2 = await widgetFrame.waitForSelector(
        ".main-composer-send-button",
        { visible: true, timeout: 300000 }
    );
    await sendButton2.click();
    console.log(`${visitorName} sent`);*/
    await new Promise((res) => {
        setTimeout(res, timeOnPage * 1000)
    })
    await har.stop();
    const data = fs.readFileSync(har.path);
    const jsonContents = JSON.parse(data);
    for(let reqObj in jsonContents.log.entries) {
        const req = jsonContents.log.entries[reqObj];
        const reqUrl = req.request.url;
        /*switch (reqUrl) {
            case "https://plzwa4.acquire.io/simulate" : metrics.pageload = req.time;
            case "https://plzwa4.acquire.io/api/v1/crm/messenger/visitor/init?-x-user-type=contact" : metrics.initload = req.time;
            case "https://plzwa4.acquire.io/api/v1/crm/messenger/chat/add-message?-x-user-type=contact" : metrics.addMessageLoad = req.time;
            case "https://plzwa4.acquire.io/api/v1/crm/messenger/chat/create?-x-user-type=contact" : metrics.createChatLoad = metrics.addMessageLoad + req.time;
            default : console.log("no matches----"); break;
        }*/
        if(req && req.request && req.request.url && req.request.url === `https://plzwa4.acquire.io/simulate`) {
            metrics.pageload = req.time;
        }
        if(req && req.request && req.request.url && req.request.url === "https://plzwa4.acquire.io/api/v1/crm/messenger/visitor/init?-x-user-type=contact") {
            metrics.initload = req.time;
        }
        if(req && req.request && req.request.url && req.request.url === "https://plzwa4.acquire.io/api/v1/crm/messenger/chat/add-message?-x-user-type=contact") {
            metrics.addMessageLoad = req.time;
        } 
        if(req && req.request && req.request.url && req.request.url === "https://plzwa4.acquire.io/api/v1/crm/messenger/chat/create?-x-user-type=contact") {
            metrics.createChatLoad = metrics.addMessageLoad + req.time;
        }
    }
    return [200, "ok",metrics]
}
const openConnection = async () => {
    const browser = await puppeteer.launch(PUPPETEER_OPTIONS);
    const page = await browser.newPage();
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
    
    // Start the HTTP Tracing
    await har.start({ path: './'+timestamp+'results.har' });
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36'
    );
    await page.setViewport({ width: 1366,height: 768});
    return { browser, page, har, socketConnect };
};
const closeConnection = async (page, browser, har) => {
    //await har.stop();
    page && (await page.close());
    browser && (await browser.close());
    /*const data = fs.readFileSync(har.path);
    const jsonContents = JSON.parse(data);
    for(let reqObj in jsonContents.log.entries) {
        const req = jsonContents.log.entries[reqObj];
        if(req && req.request && req.request.url && req.request.url === `https://plzwa4.acquire.io/simulate`) {
            metrics.pageload = req.time;
        }
        if(req && req.request && req.request.url && req.request.url === "https://plzwa4.acquire.io/api/v1/crm/messenger/visitor/init?-x-user-type=contact") {
            metrics.initload = req.time;
        }  
    }*/
    /*jsonContents.log.entries.map((req)=>{
        //console.log("requesting urls as",req.request.url);
        if(req && req.request && req.request.url && req.request.url === "https://plzwa4.acquire.io/api/v1/crm/messenger/visitor/init?-x-user-type=contact") {
            console.log("resulting this",req.time);
        }
    });*/
};
exports.openVisitor = async (req, res) => {
    let { browser, page, har, socketConnect } = await openConnection();
    let resp = {
        status: 200,
        text: 'ok'
    };
    let chat_metrics = {};
    try {
        if (req.query.hostname) {
        let maxPages = req.query.pages || 1;
        for (let i = 0; i < maxPages; i++) {
            let [status, text, metrics] = await startChat(req.query.hostname, browser, page, req.query.pagetime || 5, req.query.testname || null,har);
            if (status >= 200) {
                resp.status = status;
                resp.text = text;
                chat_metrics = metrics;
                throw new Error(text);
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
        await closeConnection(page, browser, har);
        //console.log(metrics);
        Object.assign(chat_metrics,socketConnect);
        const testData = {"test":req.query.testname,chat_metrics};
        req.query.testname && logData(testData);
    }
    res.status(resp.status).send(resp.text);
};