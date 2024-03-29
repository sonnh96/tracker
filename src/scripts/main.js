import platform from 'platform'

const isBrowser = typeof window !== 'undefined'

/**
 * Validates options and sets defaults for undefined properties.
 * @param {?Object} options
 * @returns {Object} options - Validated options.
 */
const validate = function(options = {}) {
	const _options = {}

	_options.detailed = options.detailed === true

	_options.ignoreLocalhost = options.ignoreLocalhost !== false

	_options.ignoreOwnVisits = options.ignoreOwnVisits !== false

	return _options
}

/**
 * Determines if a host is a localhost.
 * @param {String} hostname - Hostname that should be tested.
 * @returns {Boolean} isLocalhost
 */
const isLocalhost = function(hostname) {
	return (
		hostname === '' ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1'
	)
}

/**
 * Determines if user agent is a bot. Approach is to get most bots, assuming other bots don't run JS.
 * Source: https://stackoverflow.com/questions/20084513/detect-search-crawlers-via-javascript/20084661
 * @param {String} userAgent - User agent that should be tested.
 * @returns {Boolean} isBot
 */
const isBot = function(userAgent) {
	return (/bot|crawler|spider|crawling/i).test(userAgent)
}

/**
 * Checks if an id is a fake id. This is the case when Tracker ignores you because of the `sol_ignore` cookie.
 * @param {String} id - Id that should be tested.
 * @returns {Boolean} isFakeId
 */
const isFakeId = function(id) {
	return id === '88888888-8888-8888-8888-888888888888'
}

/**
 * Checks if the website is in background (e.g. user has minimzed or switched tabs).
 * @returns {boolean}
 */
const isInBackground = function() {
	return document.visibilityState === 'hidden'
}

/**
 * Get the optional source parameter.
 * @returns {String} source
 */
const source = function() {
	const source = (location.search.split(`source=`)[1] || '').split('&')[0]

	return source === '' ? undefined : source
}

/**
 * Gathers all platform-, screen- and user-related information.
 * @param {Boolean} detailed - Include personal data.
 * @returns {Object} attributes - User-related information.
 */
export const attributes = function(detailed = false) {
	const defaultData = {
		siteLocation: window.location.href,
		siteReferrer: document.referrer,
		source: source(),
	}

	const detailedData = {
		siteLanguage: (navigator.language || navigator.userLanguage).substr(0, 2),
		screenWidth: screen.width,
		screenHeight: screen.height,
		screenColorDepth: screen.colorDepth,
		deviceName: platform.product,
		deviceManufacturer: platform.manufacturer,
		osName: platform.os.family,
		osVersion: platform.os.version,
		browserName: platform.name,
		browserVersion: platform.version,
		browserWidth: window.outerWidth,
		browserHeight: window.outerHeight,
	}

	return {
		...defaultData,
		...(detailed === true ? detailedData : {}),
	}
}

/**
 * Creates an object with a query and variables property to create a record on the server.
 * @param {String} domainId - Id of the domain.
 * @param {Object} input - Data that should be transferred to the server.
 * @returns {Object} Create record body.
 */
const createRecordBody = function(domainId, input) {
	return {
		query: `
			mutation createRecord($domainId: ID!, $input: CreateRecordInput!) {
				createRecord(domainId: $domainId, input: $input) {
					payload {
						id
					}
				}
			}
		`,
		variables: {
			domainId,
			input,
		},
	}
}

/**
 * Creates an object with a query and variables property to update a record on the server.
 * @param {String} recordId - Id of the record.
 * @returns {Object} Update record body.
 */
const updateRecordBody = function(recordId) {
	return {
		query: `
			mutation updateRecord($recordId: ID!) {
				updateRecord(id: $recordId) {
					success
				}
			}
		`,
		variables: {
			recordId,
		},
	}
}

/**
 * Creates an object with a query and variables property to create an action on the server.
 * @param {String} eventId - Id of the event.
 * @param {Object} input - Data that should be transferred to the server.
 * @returns {Object} Create action body.
 */
const createActionBody = function(eventId, input) {
	return {
		query: `
			mutation createAction($eventId: ID!, $input: CreateActionInput!) {
				createAction(eventId: $eventId, input: $input) {
					payload {
						id
					}
				}
			}
		`,
		variables: {
			eventId,
			input,
		},
	}
}

/**
 * Creates an object with a query and variables property to update an action on the server.
 * @param {String} actionId - Id of the action.
 * @param {Object} input - Data that should be transferred to the server.
 * @returns {Object} Update action body.
 */
const updateActionBody = function(actionId, input) {
	return {
		query: `
			mutation updateAction($actionId: ID!, $input: UpdateActionInput!) {
				updateAction(id: $actionId, input: $input) {
					success
				}
			}
		`,
		variables: {
			actionId,
			input,
		},
	}
}

/**
 * Construct URL to the GraphQL endpoint of Tracker.
 * @param {String} server - URL of the Tracker server.
 * @returns {String} endpoint - URL to the GraphQL endpoint of the Tracker server.
 */
const endpoint = function(server) {
	const hasTrailingSlash = server.substr(-1) === '/'

	return server + (hasTrailingSlash === true ? '' : '/') + 'api'
}

/**
 * Sends a request to a specified URL.
 * Won't catch all errors as some are already logged by the browser.
 * In this case the callback won't fire.
 * @param {String} url - URL to the GraphQL endpoint of the Tracker server.
 * @param {Object} body - JSON which will be send to the server.
 * @param {Object} options
 * @param {?Function} next - The callback that handles the response. Receives the following properties: json.
 */
const send = function(url, body, options, next) {
	fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json;charset=UTF-8',
		},
		credentials: options.ignoreOwnVisits ? 'omit' : 'include',
		body: JSON.stringify(body),
	})
		.then((response) => {
			if (!response.ok) {
				throw new Error('Server returned with an unhandled status')
			}
			return response.json()
		})
		.then((json) => {
			if (json.errors != null) {
				throw new Error(json.errors[0].message)
			}

			if (typeof next === 'function') {
				return next(json)
			}
		})
		.catch((error) => {
			console.error(error)
		})
}

/**
 * Looks for an element with Tracker attributes and executes Tracker with the given attributes.
 * Fails silently.
 */
export const detect = function() {
	const elem = document.querySelector('[data-sol-domain-id]')

	if (elem == null) return

	const server = elem.getAttribute('data-sol-server') || ''
	const domainId = elem.getAttribute('data-sol-domain-id')
	const options = elem.getAttribute('data-sol-opts') || '{}'

	create(server, JSON.parse(options)).record(domainId)
}

/**
 * Creates a new instance.
 * @param {String} server - URL of the Tracker server.
 * @param {?Object} options
 * @returns {Object} instance
 */
export const create = function(server, options) {
	options = validate(options)
	const url = endpoint(server)
	const noop = () => {}

	const fakeInstance = {
		record: () => ({ stop: noop }),
		updateRecord: () => ({ stop: noop }),
		action: noop,
		updateAction: noop,
	}

	if (
		options.ignoreLocalhost === true &&
    isLocalhost(location.hostname) === true
	) {
		console.warn('Tracker ignores you because you are on localhost')
		return fakeInstance
	}

	if (isBot(navigator.userAgent) === true) {
		console.warn('Tracker ignores you because you are a bot')
		return fakeInstance
	}

	const _record = (domainId, attrs = attributes(options.detailed), next) => {
		let isStopped = false
		const stop = () => {
			isStopped = true
		}

		send(url, createRecordBody(domainId, attrs), options, (json) => {
			const recordId = json.data.createRecord.payload.id

			if (isFakeId(recordId) === true) {
				return console.warn(
          'Tracker ignores you because this is your own site',
				)
			}

			const interval = setInterval(() => {
				if (isStopped === true) {
					clearInterval(interval)
					return
				}

				if (isInBackground() === true) return

				send(url, updateRecordBody(recordId), options)
			}, 15000)

			if (typeof next === 'function') {
				return next(recordId)
			}
		})

		return { stop }
	}

	const _updateRecord = (recordId) => {
		let isStopped = false
		const stop = () => {
			isStopped = true
		}

		if (isFakeId(recordId) === true) {
			console.warn('Tracker ignores you because this is your own site')
			return { stop }
		}

		const interval = setInterval(() => {
			if (isStopped === true) {
				clearInterval(interval)
				return
			}

			if (isInBackground() === true) return

			send(url, updateRecordBody(recordId), options)
		}, 15000)

		return { stop }
	}

	const _action = (eventId, attrs, next) => {
		send(url, createActionBody(eventId, attrs), options, (json) => {
			const actionId = json.data.createAction.payload.id

			if (isFakeId(actionId) === true) {
				return console.warn(
          'Tracker ignores you because this is your own site',
				)
			}

			if (typeof next === 'function') {
				return next(actionId)
			}
		})
	}

	const _updateAction = (actionId, attrs) => {
		if (isFakeId(actionId) === true) {
			return console.warn(
        'Tracker ignores you because this is your own site',
			)
		}

		send(url, updateActionBody(actionId, attrs), options)
	}

	return {
		record: _record,
		updateRecord: _updateRecord,
		action: _action,
		updateAction: _updateAction,
	}
}

if (isBrowser === true) {
	detect()
}