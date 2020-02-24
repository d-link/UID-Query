/**
 * Created by lizhimin on 2016/2/22.
 */
angular.module('dview8.components',['dview8.components.icon']);
var config = {
    defaultViewBoxSize: 24,
    defaultFontSet: 'material-icons',
    fontSets : [ ]
};
function MdIconProvider() { }

MdIconProvider.prototype = {
    icon : function (id, url, viewBoxSize) {
        if ( id.indexOf(':') == -1 ) id = '$default:' + id;

        config[id] = new ConfigurationItem(url, viewBoxSize );
        return this;
    },

    iconSet : function (id, url, viewBoxSize) {
        config[id] = new ConfigurationItem(url, viewBoxSize );
        return this;
    },

    defaultIconSet : function (url, viewBoxSize) {
        var setName = '$default';

        if ( !config[setName] ) {
            config[setName] = new ConfigurationItem(url, viewBoxSize );
        }

        config[setName].viewBoxSize = viewBoxSize || config.defaultViewBoxSize;

        return this;
    },

    defaultViewBoxSize : function (viewBoxSize) {
        config.defaultViewBoxSize = viewBoxSize;
        return this;
    },

    /**
     * Register an alias name associated with a font-icon library style ;
     */
    fontSet : function fontSet(alias, className) {
        config.fontSets.push({
            alias : alias,
            fontSet : className || alias
        });
        return this;
    },

    /**
     * Specify a default style name associated with a font-icon library
     * fallback to Material Icons.
     *
     */
    defaultFontSet : function defaultFontSet(className) {
        config.defaultFontSet = !className ? '' : className;
        return this;
    },

    defaultIconSize : function defaultIconSize(iconSize) {
        config.defaultIconSize = iconSize;
        return this;
    },

    preloadIcons: function ($templateCache) {
        var iconProvider = this;
        var svgRegistry = [
            {
                id : 'md-tabs-arrow',
                url: 'md-tabs-arrow.svg',
                svg: '<svg version="1.1" x="0px" y="0px" viewBox="0 0 24 24"><g><polygon points="15.4,7.4 14,6 8,12 14,18 15.4,16.6 10.8,12 "/></g></svg>'
            },
            {
                id : 'md-close',
                url: 'md-close.svg',
                svg: '<svg version="1.1" x="0px" y="0px" viewBox="0 0 24 24"><g><path d="M19 6.41l-1.41-1.41-5.59 5.59-5.59-5.59-1.41 1.41 5.59 5.59-5.59 5.59 1.41 1.41 5.59-5.59 5.59 5.59 1.41-1.41-5.59-5.59z"/></g></svg>'
            },
            {
                id:  'md-cancel',
                url: 'md-cancel.svg',
                svg: '<svg version="1.1" x="0px" y="0px" viewBox="0 0 24 24"><g><path d="M12 2c-5.53 0-10 4.47-10 10s4.47 10 10 10 10-4.47 10-10-4.47-10-10-10zm5 13.59l-1.41 1.41-3.59-3.59-3.59 3.59-1.41-1.41 3.59-3.59-3.59-3.59 1.41-1.41 3.59 3.59 3.59-3.59 1.41 1.41-3.59 3.59 3.59 3.59z"/></g></svg>'
            },
            {
                id:  'md-menu',
                url: 'md-menu.svg',
                svg: '<svg version="1.1" x="0px" y="0px" viewBox="0 0 24 24"><path d="M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z" /></svg>'
            },
            {
                id:  'md-toggle-arrow',
                url: 'md-toggle-arrow-svg',
                svg: '<svg version="1.1" x="0px" y="0px" viewBox="0 0 48 48"><path d="M24 16l-12 12 2.83 2.83 9.17-9.17 9.17 9.17 2.83-2.83z"/><path d="M0 0h48v48h-48z" fill="none"/></svg>'
            },
            {
                id:  'md-calendar',
                url: 'md-calendar.svg',
                svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>'
            }
        ];

        svgRegistry.forEach(function(asset){
            iconProvider.icon(asset.id,  asset.url);
            $templateCache.put(asset.url, asset.svg);
        });

    },

    $get : ['$http', '$q', '$log', '$templateCache', function($http, $q, $log, $templateCache) {
        this.preloadIcons($templateCache);
        return MdIconService(config, $http, $q, $log, $templateCache);
    }]
};

/**
 *  Configuration item stored in the Icon registry; used for lookups
 *  to load if not already cached in the `loaded` cache
 */
function ConfigurationItem(url, viewBoxSize) {
    this.url = url;
    this.viewBoxSize = viewBoxSize || config.defaultViewBoxSize;
}


/* @ngInject */
function MdIconService(config, $http, $q, $log, $templateCache) {
    var iconCache = {};
    var urlRegex = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/i;

    Icon.prototype = { clone : cloneSVG, prepare: prepareAndStyle };
    getIcon.fontSet = findRegisteredFontSet;

    // Publish service...
    return getIcon;

    /**
     * Actual $mdIcon service is essentially a lookup function
     */
    function getIcon(id) {
        id = id || '';

        // If already loaded and cached, use a clone of the cached icon.
        // Otherwise either load by URL, or lookup in the registry and then load by URL, and cache.

        if ( iconCache[id]         ) return $q.when( iconCache[id].clone() );
        if ( urlRegex.test(id)     ) return loadByURL(id).then( cacheIcon(id) );
        if ( id.indexOf(':') == -1 ) id = '$default:' + id;

        var load = config[id] ? loadByID : loadFromIconSet;
        return load(id)
            .then( cacheIcon(id) );
    }

    /**
     * Lookup registered fontSet style using its alias...
     * If not found,
     */
    function findRegisteredFontSet(alias) {
        var useDefault = angular.isUndefined(alias) || !(alias && alias.length);
        if ( useDefault ) return config.defaultFontSet;

        var result = alias;
        angular.forEach(config.fontSets, function(it){
            if ( it.alias == alias ) result = it.fontSet || result;
        });

        return result;
    }

    /**
     * Prepare and cache the loaded icon for the specified `id`
     */
    function cacheIcon( id ) {

        return function updateCache( icon ) {
            iconCache[id] = isIcon(icon) ? icon : new Icon(icon, config[id]);

            return iconCache[id].clone();
        };
    }

    /**
     * Lookup the configuration in the registry, if !registered throw an error
     * otherwise load the icon [on-demand] using the registered URL.
     *
     */
    function loadByID(id) {
        var iconConfig = config[id];
        return loadByURL(iconConfig.url).then(function(icon) {
            return new Icon(icon, iconConfig);
        });
    }

    /**
     *    Loads the file as XML and uses querySelector( <id> ) to find
     *    the desired node...
     */
    function loadFromIconSet(id) {
        var setName = id.substring(0, id.lastIndexOf(':')) || '$default';
        var iconSetConfig = config[setName];

        return !iconSetConfig ? announceIdNotFound(id) : loadByURL(iconSetConfig.url).then(extractFromSet);

        function extractFromSet(set) {
            var iconName = id.slice(id.lastIndexOf(':') + 1);
            if(iconName){
                var icon = set.querySelector('#' + iconName);
                return !icon ? announceIdNotFound(id) : new Icon(icon, iconSetConfig);
            }else{
                return announceIdNotFound(id);
            }

        }

        function announceIdNotFound(id) {
            var msg = 'icon ' + id + ' not found';
            $log.warn(msg);

            return $q.reject(msg || id);
        }
    }

    /**
     * Load the icon by URL (may use the $templateCache).
     * Extract the data for later conversion to Icon
     */
    function loadByURL(url) {
        return $http
            .get(url, { cache: $templateCache })
            .then(function(response) {
                return angular.element('<div>').append(response.data).find('svg')[0];
            }).catch(announceNotFound);
    }

    /**
     * Catch HTTP or generic errors not related to incorrect icon IDs.
     */
    function announceNotFound(err) {
        var msg = angular.isString(err) ? err : (err.message || err.data || err.statusText);
        $log.warn(msg);

        return $q.reject(msg);
    }

    /**
     * Check target signature to see if it is an Icon instance.
     */
    function isIcon(target) {
        return angular.isDefined(target.element) && angular.isDefined(target.config);
    }

    /**
     *  Define the Icon class
     */
    function Icon(el, config) {
        if (el && el.tagName != 'svg') {
            el = angular.element('<svg xmlns="http://www.w3.org/2000/svg">').append(el)[0];
        }

        // Inject the namespace if not available...
        if ( !el.getAttribute('xmlns') ) {
            el.setAttribute('xmlns', "http://www.w3.org/2000/svg");
        }

        this.element = el;
        this.config = config;
        this.prepare();
    }

    /**
     *  Prepare the DOM element that will be cached in the
     *  loaded iconCache store.
     */
    function prepareAndStyle() {
        var viewBoxSize = this.config ? this.config.viewBoxSize : config.defaultViewBoxSize;
        angular.forEach({
            'fit'   : '',
            'height': '100%',
            'width' : '100%',
            'preserveAspectRatio': 'xMidYMid meet',
            'viewBox' : this.element.getAttribute('viewBox') || ('0 0 ' + viewBoxSize + ' ' + viewBoxSize)
        }, function(val, attr) {
            this.element.setAttribute(attr, val);
        }, this);
    }

    /**
     * Clone the Icon DOM element.
     */
    function cloneSVG(){
        // If the element or any of its children have a style attribute, then a CSP policy without
        // 'unsafe-inline' in the style-src directive, will result in a violation.
        return this.element.cloneNode(true);
    }

}

angular.module('dview8.components.icon',[]).provider('$mdIcon', MdIconProvider)
    .directive('mdIcon', ['$mdIcon', mdIconDirective]);
function mdIconDirective($mdIcon) {

    return {
        scope: {
            svgIcon : '@mdSvgIcon',
            svgSrc  : '@mdSvgSrc'
        },
        restrict: 'E',
        link : postLink
    };


    /**
     * Directive postLink
     * Supports embedded SVGs, font-icons, & external SVGs
     */
    function postLink(scope, element, attr) {

        // If using a font-icon, then the textual name of the icon itself
        // provides the aria-label.

        var label = attr.alt || scope.fontIcon || scope.svgIcon || element.text();
        var attrName = attr.$normalize(attr.$attr.mdSvgIcon || attr.$attr.mdSvgSrc || '');
        if (attrName) {
            // Use either pre-configured SVG or URL source, respectively.
            attr.$observe(attrName, function(attrVal) {

                element.empty();
                if (attrVal) {
                    $mdIcon(attrVal)
                        .then(function(svg) {
                            element.empty();
                            element.append(svg);
                        });
                }

            });
        }

        function parentsHaveText() {
            var parent = element.parent();
            if (parent.attr('aria-label') || parent.text()) {
                return true;
            }
            else if(parent.parent().attr('aria-label') || parent.parent().text()) {
                return true;
            }
            return false;
        }
    }
}