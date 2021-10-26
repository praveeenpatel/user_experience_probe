CREATE DATABASE IF NOT EXISTS `test_scripts`;
CREATE TABLE IF NOT EXISTS `test_scripts`.`chatLoadWidget` (
        `pageLoad` decimal (24,16) NOT NULL,
        `initLoad` decimal (24,16) NOT NULL,
         `widgetLoad` decimal (24,16) NOT NULL,
        `addMessageLoad` decimal (24,16) NOT NULL,
        `createChatLoad` decimal (24,16) NOT NULL,
        `testName` VARCHAR(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

