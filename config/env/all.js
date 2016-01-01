'use strict';

module.exports = {
	app: {
		title: 'Pythia LMS',
		description: 'Pythia LMS is an application to create courses with Pythia problems and manage learners.',
		keywords: 'Pythia,LMS'
	},
	port: process.env.PORT || 3000,
	templateEngine: 'swig',
	sessionSecret: 'MEAN',
	sessionCollection: 'sessions',
	assets: {
		lib: {
			css: [
				'public/lib/bootstrap/dist/css/bootstrap.css',
				'public/lib/bootstrap/dist/css/bootstrap-theme.css',
				'public/lib/ng-tags-input/ng-tags-input.css',
				'public/lib/ng-tags-input/ng-tags-input.bootstrap.css',
				'public/lib/angular-bootstrap-datetimepicker/src/css/datetimepicker.css',
				'public/lib/nya-bootstrap-select/dist/css/nya-bs-select.css',
				'public/lib/CodeMirror/lib/codemirror.css',
				'public/lib/CodeMirror/theme/neo.css'
			],
			js: [
				'public/lib/angular/angular.js',
				'public/lib/angular-animate/angular-animate.js',
				'public/lib/angular-bootstrap/ui-bootstrap-tpls.js',
				'public/lib/CodeMirror/lib/codemirror.js',
				'public/lib/CodeMirror/mode/clike/clike.js',
				'public/lib/CodeMirror/mode/python/python.js',
				'public/lib/angular-cookies/angular-cookies.js',
				'public/lib/angular-mocks/angular-mocks.js',
				'public/lib/moment/moment.js',
				'public/lib/angular-moment/angular-moment.js',
				'public/lib/angular-resource/angular-resource.js',
				'public/lib/angular-sanitize/angular-sanitize.js',
				'public/lib/angular-touch/angular-touch.js',
				'public/lib/angular-ui-event/dist/event.js',
				'public/lib/angular-ui-indeterminate/dist/indeterminate.js',
				'public/lib/angular-ui-mask/dist/mask.js',
				'public/lib/angular-ui-router/release/angular-ui-router.js',
				'public/lib/angular-ui-scroll/dist/ui-scroll.js',
				'public/lib/angular-ui-scrollpoint/dist/scrollpoint.js',
				'public/lib/angular-ui-uploader/dist/uploader.js',
				'public/lib/angular-ui-validate/dist/validate.js',
				'public/lib/angular-ui-utils/index.js',
				'public/lib/jquery/dist/jquery.js',
				'public/lib/ng-tags-input/ng-tags-input.js',
				'public/lib/nya-bootstrap-select/dist/js/nya-bs-select.js',
				'public/lib/angular-bootstrap-datetimepicker/src/js/datetimepicker.js',
				'public/lib/bootstrap/dist/js/bootstrap.js',
				'public/lib/CodeMirror/addon/selection/active-line.js',
				'public/lib/angular-ui-codemirror/ui-codemirror.js',
				'public/lib/angular-bind-html-compile/angular-bind-html-compile.js',
				'public/lib/angular-translate/angular-translate.js',
				'public/lib/angular-translate-loader-static-files/angular-translate-loader-static-files.js',
				'public/lib/angular-translate-storage-cookie/angular-translate-storage-cookie.js',
				'public/lib/angular-translate-storage-local/angular-translate-storage-local.js',
				'public/lib/flot/jquery.flot.js',
				'public/lib/flot/jquery.flot.pie.js',
				'public/lib/angular-flot/angular-flot.js',
				'public/lib/MathJax/MathJax.js',
				'public/lib/MathJax/config/TeX-AMS_HTML.js'
			]
		},
		css: [
			'public/modules/**/css/*.css'
		],
		js: [
			'public/config.js',
			'public/application.js',
			'public/modules/*/*.js',
			'public/modules/*/*[!tests]*/*.js'
		],
		tests: [
			'public/lib/angular-mocks/angular-mocks.js',
			'public/modules/*/tests/*.js'
		]
	}
};
