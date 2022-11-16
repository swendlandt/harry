const {Builder, By} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const nodemailer = require("nodemailer");
const fs = require("fs");

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: '<mail-adress>',
        pass: '<password>'
    }
});
(async () => {

    const driver = await new Builder().forBrowser('chrome').setChromeOptions(new chrome.Options().headless()).build();
    await driver.manage().setTimeouts({implicit: 80000});

    const checkAvailability = async () => {
        await driver.get('https://tickets.wbstudiotour.co.uk/webstore/shop/ViewItems.aspx?CG=HPTST2&C=TIX2&_ga=2.157020283.151391275.1663521658-1853951296.1663521658&_gl=1*1c219cu*_ga*MTg1Mzk1MTI5Ni4xNjYzNTIxNjU4*_ga_XFV6SM08Y0*MTY2MzUyMTY1OC4xLjEuMTY2MzUyMTY3OC4wLjAuMA..&qitq=5f789dae-494a-4b3c-8946-4c7dfca88279&qitp=16976011-5a43-43bb-a924-8f961c5e9f14&qitts=1663521703&qitc=wbstudiotour&qite=wbmainwebstore&qitrt=Queue&qith=4f06947f0a7537ce4f318942672544a2');

        try {
            const rejectButton = await driver.findElement(By.id("onetrust-reject-all-handler"));
            await rejectButton.click();
        } catch (e) {
            //nothing
        }

        await driver.executeScript("window.scrollTo(0, 0)");

        const increaseButton = await driver.findElement(By.css('.next.typcn.typcn-plus'));
        await increaseButton.click();
        await increaseButton.click();

        const selectDateButton = await driver.findElement(By.css('.typcn.typcn-calendar'));
        await selectDateButton.click();

        await new Promise(resolve => {
            setTimeout(resolve, 5000)
        });

        const interestingDays = ["29/10/2022", "30/10/2022", "31/10/2022"];

        const checkDay = async day => {
            let interestingDay;
            try {
                interestingDay = await driver.findElement(By.css(`[aria-label='${day}']`));
            } catch (e) {
                return;
            }
            const classes = await interestingDay.getAttribute("class");

            if (classes.includes("available")) {

                const mailOptions = {
                    from: '<mail-adress>',
                    to: ["<mail-adress>"],
                    subject: 'Dates available for Harry Potter Studios tour!',
                    text: `Available for ${day} https://www.wbstudiotour.co.uk/tickets/#individual-family`
                };

                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                    }
                });
            }
        }

        for (const day of interestingDays) {
            await checkDay(day);
        }
    };
    while (true) {
        try {
            console.log(new Date() + " Checking again.....")
            await checkAvailability();
        } catch (e) {
            console.log(e);
            try {
                await driver.takeScreenshot().then(
                    function(image, ) {
                        fs.writeFile(`screenshot_${Date.now()}.png`, image, 'base64', function(err) {
                            console.log(err);
                        });
                    }
                );
            } catch (e) {
                //continue
            }
        }
    }
})()
