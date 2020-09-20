const { program } = require('commander');
const { start } = require('./command');

program
  .version('0.0.1')
  .description('addic7ed srt crawler')

program
  .command("start")
  .alias('s')
  .description('start the crawl')
  .action(() => start())

program.parse(process.argv)
