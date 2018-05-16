#!/usr/bin/env node

const	{Builder, By, Key, until} = require('selenium-webdriver'),
		readline = require('readline');

var driver;
	
async function firstGoogleIndex()
{
	let siteSearchURI = 'https://www.google.com/search?tbs=cdr%3A1%2Ccd_min%3A1%2F1%2F2000&q=site%3A%SITE_PLACEHOLDER%&safe=active&gws_rd=ssl',
		blogPost = await driver.getCurrentUrl();

	siteSearchURI = siteSearchURI.replace(/%SITE_PLACEHOLDER%/, encodeURI(blogPost));

	await driver.get(siteSearchURI);

	await driver.wait(until.elementLocated(By.css('span.st')))

	let firstCrawlDate = await driver.findElement(By.css('span.st:first-of-type span:first-child')).getText();

	firstCrawlDate = firstCrawlDate.replace(/\s+-/, '');

	console.log(`Google first crawled this page on ${firstCrawlDate}`);

	await driver.quit();
}

async function pollDisqusComments()
{
	let commentDates = [];

	try
	{
		await driver.wait(until.elementLocated(By.css('#disqus_thread iframe:last-child')))
			.then(frame => driver.switchTo().frame(frame));
	}

	catch (err)
	{
		console.log('Could not find Disqus on this page.');
		firstGoogleIndex();
		return;
	}

	const disqusCommentDates = await driver.findElements(By.className('time-ago'));
	
	for (let commentDate of disqusCommentDates)
	{
		commentDate = await commentDate.getAttribute('title');
		commentDates.push(commentDate);
	}

	let earliestComment = commentDates.slice(-1)[0];
	earliestComment = earliestComment.split(' ').slice(0, 4).join(' ');

	if (earliestComment && earliestComment.length > 0)
	{
		console.log(`The first Disqus comment was published on ${earliestComment}`);
	}

	firstGoogleIndex();
	
};

async function initCrawlers(resourceURI)
{
	try
	{
		await driver.get(resourceURI);

		try
		{
			pollDisqusComments();
		}

		catch (error)
		{
			console.log(error);	
		}
	}

catch (err)
{
	console.log(err);
}
}

function main()
{
	let prompt1 = readline.createInterface(
	{
		input: process.stdin,
		output: process.stdout
	});

	prompt1.question('Please enter a URL: ', (url) =>
	{
		if (String(url.trim()).length < 1)
		{
			console.log('URL cannot be empty!');
			process.exit(1);
		}

		if (!String(url).match(/(http|https)/))
		{
			console.log('Please include the HTTP or HTTPS protocol.');
			process.exit(1);
		}

		let chrome = require('selenium-webdriver/chrome');

		driver = new Builder()
			.forBrowser('chrome')
			.setChromeOptions(new chrome.Options().headless())
			.build();

		initCrawlers(url);
		
		prompt1.close();
	});
}

main();
