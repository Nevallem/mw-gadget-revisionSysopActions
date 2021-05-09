/**
 * Gadget that improves the creation of a new request in "Wikipédia:Pedidos/Revisão de ações administrativas"
 *
 * @author [[w:pt:User:!Silent]]
 * @date 06/jan/2014
 * @update 08/mai/2021
 */
/* jshint laxbreak:true */
/* global mw, $ */

( function() {
'use strict';

mw.messages.set( {
	'rsa-title': 'Adicione aqui o sufixo do título da revisão. Exemplo: se a revisão for sobre uma negativa de bloqueio, coloque o nome do usuário que deveria ter sido bloqueado',
	'rsa-argumentation': 'Argumente sobre a revisão da ação adminstrativa.',
	'rsa-editor': 'Responsável pela ação administrativa contestada:',
	'rsa-fillFields': 'Preencha todos os campos.',
	'rsa-defaultSufix': ', usando [[MediaWiki:Gadget-revisionsSysopsActions.js|um gadget]].',
	'rsa-error': 'Ocorreu um erro entre as edições.',
	'rsa-summary-requestPage': 'Criando novo pedido de revisão administrativa',
	'rsa-summary-requestList': 'Adicionando [[$1|novo pedido]] de revisão administrativa',
	'rsa-notify-requestPage': 'Criando novo pedido de revisão administrativa...',
	'rsa-notify-requestList': 'Adicionando o pedido a lista...',
	'rsa-types': 'Selecione o tipo de ação administrativa',
	'rsa-previewDisabled': 'O botão de mostrar previsão não está habilitado no momento.'
} );

/**
 * @class rsa Revisions Sysops Actions
 */
var rsa = {},
	pageName = mw.config.get( 'wgPageName' ),
	api = new mw.Api();

/**
 * Messages
 * @see [[mw:ResourceLoader/Default_modules#mediaWiki.message]]
 * @return {string}
 */
rsa.message = function( /*name[, $1[, $2[, ... ]]]*/ ) {
	return mw.message.apply( this, arguments ).plain();
};

/**
 * Edit a page
 * @param {mediaWiki.messages} notifyMsg
 * @param {object} info Edit params
 * @return {jQuery.Deferred}
 * @see see [[mw:API:Edit]]
 */
rsa.editPage = function( notifyMsg, info ) {
	mw.notify( notifyMsg, {
		hide: false
	} );

	return api.editPage( info );
};

/**
 * Create the new request
 * @return {boolean} false don't submit
 */
rsa.create = function() {
	var currentDate = new Date(),
		requestTitle = pageName + '/' + $( '#rsa-types' ).val() + '/' + $( '#wpSummary' ).val()
			+ ' (' + currentDate.getDate() + mw.config.get( 'wgMonthNames' )[ currentDate.getMonth() + 1 ].substr( 0, 3 ) + currentDate.getFullYear() + ')';

	requestTitle = requestTitle.replace( /_/g, ' ' );

	api.getCurrentPageText( 'Wikipédia:Pedidos/Revisão de ações administrativas/Novarevisão' ).done( function( value ) {
		$.when(
			rsa.editPage( rsa.message( 'rsa-notify-requestPage' ), {
				title: requestTitle,
				summary: rsa.message( 'rsa-summary-requestPage' ) + rsa.message( 'rsa-defaultSufix' ),
				text: value
					.replace( /<\/?includeonly>/g, '' )
					.replace( /(Responsável pela ação administrativa contestada: ).+/, '$1' + '{{usuário|' + $( '#rsa-editor' ).val() + '}}' )
					.replace( /Motivo pelo qual acredita.+/, $( '#wpTextbox1' ).val() )
			} ),
			rsa.editPage( rsa.message( 'rsa-notify-requestList' ), {
				summary: rsa.message( 'rsa-summary-requestList', requestTitle ) + rsa.message( 'rsa-defaultSufix' ),
				appendtext: '\n\n{{:' + requestTitle + '}}'
			} )
		).then( function() {
			window.onbeforeunload = null;
			$( '#editform' ).trigger( 'submit' ); // necessary in some cases to skip unload warning
			location.href = mw.util.getUrl( requestTitle );
		}, function() {
			alert( rsa.message( 'rsa-error' ) );
		} );
	} );
};


/**
 * Executes the gadget
 * @return {undefined}
 */
rsa.run = function() {
	var $wpSummary = $( '#wpSummary' ),
		$wpTextbox = $( '#wpTextbox1' ),
		subjects = [ {
				name: 'Autorrevisor',
				placeholder: 'Nome do editor'
			}, {
				name: 'Reversor',
				placeholder: 'Nome do editor'
			}, {
				name: 'Eliminador',
				placeholder: 'Nome do editor'
			}, {
				name: 'Negativa de bloqueio',
				placeholder: 'Nome do editor'
			}, {
				name: 'Blacklist',
				placeholder: 'Nome do site'
			}, {
				name: 'Whitelist',
				placeholder: 'Nome do site'
			}, {
				name: 'Proteção',
				placeholder: 'Nome da página'
			}, {
				name: 'Supressão',
				placeholder: 'Nome da página'
			}, {
				name: 'Negativa de restauro',
				placeholder: 'Nome da página'
			}, {
				name: 'Páginas para eliminar',
				placeholder: 'Nome da página'
			}, {
				name: 'Outro',
				placeholder: ''
			}
		];

	$( 'label[for="wpSummary"]' ).before(
		'<label>' + rsa.message( 'rsa-types' ) + '<br />'
			+ '<select id="rsa-types">'
				+ '<option></option>'
			+ '</select>'
		+ '</label><br />'
		+ '<label>' + rsa.message( 'rsa-editor' ) + '<br />'
			+ '<input type="text" id="rsa-editor" size="30" />'
		+ '</label><br />'
	);

	$wpTextbox.attr( 'placeholder', rsa.message( 'rsa-argumentation' ) );

	$( subjects ).each( function( i ) {
		$( '#rsa-types' )
			.append( '<option value="' + subjects[ i ].name + '">' + subjects[ i ].name + '</option>' )
			.find( 'option:last' ).click( function() {
				$wpSummary.attr( 'placeholder', subjects[ i ].placeholder );
			} );
	} );

	$( '#wpSave' ).click( function( e ) {
		e.preventDefault();

		if ( !$wpSummary.val() || !$wpTextbox.val() || !$( '#rsa-editor' ).val() || !$( '#rsa-types' ).val() ) {
			alert( rsa.message( 'rsa-fillFields' ) );
		} else {
			rsa.create();
		}
	} );

	$( '#wpPreview' ).attr( {
		'disabled': true,
		'title': rsa.message( 'rsa-previewDisabled' )
	} );
};

if ( pageName === 'Wikipédia:Pedidos/Revisão_de_ações_administrativas'
	&& $.inArray( mw.config.get( 'wgAction' ), [ 'edit', 'submit' ] ) !== -1
	&& mw.util.getParamValue( 'section' ) === 'new'
) {
	$( rsa.run );
}

}() );
