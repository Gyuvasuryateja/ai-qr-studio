import translate from 'translate';
translate.engine = 'google';
translate('Hello world, it is working!', 'te').then(console.log).catch(console.error);
