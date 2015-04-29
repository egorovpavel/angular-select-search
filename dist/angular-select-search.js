angular.module('selectSearch', [])
.directive('selectSearch', function($window, $filter, $timeout, $animate) {
    return {
        restrict: 'A'
        , templateUrl: 'templates/angular-select-search.html'
        , scope: {
            itemsAll: '=selectSearch'
            , value: '=ngModel'
            , name: '@'
            , selected: '='

            , ngRequired: '='
            , ngDisabled: '='

            , ssHeight: '@'
            , ssClass: '@'
            , ssId: '@'
            , content: '@'
            , key: '@'
            , placeholder : '@'
        }
        , controller: function($scope) {
            $scope.items = $scope.itemsAll;
            $scope.ssHeight = $scope.ssHeight || 200;
            $scope.content = $scope.content || 'title';
            $scope.key = $scope.key || 'value';
            $scope.placeholder = $scope.placeholder || '';
            $scope.index = -1;
            $scope.select = function(index, condition) {
                index = parseInt(index);
                condition = (angular.isDefined(condition)) ? condition : true;
                if (!condition) {
                    return;
                }

                $scope.index = index;
                if (angular.isDefined($scope.selected)) {
                    $scope.selected = index;
                }

                if (!angular.isDefined($scope.items[index])) {
                    return;
                }
                $scope.value = $scope.items[index][$scope.key];
                $scope.title = $scope.items[index][$scope.content];
            };

            $scope.dropup = false;
            $scope.reposition = function() {
                var pos = $scope.dropdownMenu.getBoundingClientRect()
                    , spaceTop = pos.top
                    , spaceBot = $window.innerHeight - pos.bottom;
                if (!$scope.dropup && spaceBot < 16) {
                    $scope.dropup = true;
                }
                else if ($scope.dropup && spaceTop < 6) {
                    $scope.dropup = false;
                }
                if (pos.bottom - pos.top > $window.innerHeight / 2) {
                    $scope.dropup = false;
                }
                $scope.$apply();
            };

            $scope.opened = false;
            $scope.toggle = function(ev) {
                ev.preventDefault();
                ev.stopPropagation();
                $scope.opened = !$scope.opened;
                if (!$scope.opened) {
                    $scope.touched();
                }
                $scope.fix();
            };
            $scope.close = function() {
                if ($scope.opened) {
                    $scope.touched();
                    $scope.el.blur();
                }
                $scope.opened = false;
                $scope.$apply();
                $scope.fix();
            };

            $scope.fix = function() {
                $scope.filter = '';
                $timeout(function() {
                    if ($scope.opened) {
                        $scope.searchInput.focus();
                        angular.element($window).bind('keydown', $scope.keydown);
                    }
                    else {
                        angular.element($window).unbind('keydown', $scope.keydown);
                    }
                    $scope.reposition();
                    $scope.moveScroll();
                }, 10);
            };

            $scope.keydown = function(ev) {
                if (ev.keyCode === 27) {
                    $scope.close();
                }
                if (ev.keyCode === 40) {
                    $scope.down();
                }
                if (ev.keyCode === 38) {
                    $scope.up();
                }
                if (ev.keyCode === 13) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    $scope.select($scope.index);
                    $scope.close();
                }
            };

            $scope.down = function() {
                if ($scope.index + 1 < $scope.items.length) {
                    $scope.index++;
                    $scope.$apply();
                    $scope.moveScroll();
                }
            };

            $scope.up = function() {
                var newIndex = $scope.index - 1;
                if ($scope.index - 1 >= 0) {
                    $scope.index -= 1;
                    $scope.$apply();
                    $scope.moveScroll();
                }
            };

            $scope.moveScroll = function() {
                var ul = angular.element($scope.dropdownMenu).find('ul')
                    , liElems = ul.find('li');
                Array.prototype.forEach.call(liElems, function(li, i) {
                    if (!angular.element(li).hasClass('active')) {
                        return;
                    }
                    var posLi = li.getBoundingClientRect()
                        , posMenu = $scope.dropdownMenu.getBoundingClientRect();

                    if (posLi.bottom > posMenu.bottom || posLi.top > posMenu.top) {
                        ul[0].scrollTop = (posLi.bottom - posLi.top) * i;
                    }
                });
            };

            $scope.removeWatchers = $scope.$watch('[filter,value,itemsAll]', function() {
                $scope.items = $filter('filter')($scope.itemsAll, $scope.filter);
                $scope.index = -1;
                $scope.moveScroll();
            }, true);

            $scope.noop = function(ev) {
                ev.preventDefault();
                ev.stopPropagation();
            };

        }
        , link: function(scope, element, attrs) {
            scope.el = element;

            Array.prototype.forEach.call(element.find('div'), function(elem) {
                if (angular.element(elem).hasClass('dropdown-menu')) {
                    scope.dropdownMenu = elem;
                }
                else if (angular.element(elem).hasClass('bs-searchbox')) {
                    scope.searchInput = angular.element(elem).find('input')[0];
                }
            });

            scope.touched = function() {
                var formController = element.controller('form');
                if (angular.isDefined(formController) && angular.isDefined(scope.name)) {
                    formController[scope.name].$touched = true;
                    formController[scope.name].$untouched = false;
                    if(scope.ngRequired){
                        formController[scope.name].$setValidity('required',angular.isDefined(scope.value));
                    }else{
                        formController[scope.name].$setValidity('required',true);
                    }
                }
                $animate.setClass(element, 'ng-touched', 'ng-untouched');
            };

            angular.element($window)
                .bind('resize', scope.reposition)
                .bind('scroll', scope.reposition)
                .bind('click', scope.close);

            scope.$on('$destroy', function() {
                scope.removeWatchers();
                angular.element($window)
                    .unbind('resize', scope.reposition)
                    .unbind('scroll', scope.reposition)
                    .unbind('click', scope.close);
            });
        }
    };
});
angular.module("selectSearch").run(["$templateCache", function($templateCache) {$templateCache.put("templates/angular-select-search.html","<div ng-class=\"{ open: opened, dropup: dropup }\"\n  class=\"btn-group bootstrap-select {{ssClass}}\">\n    <button ng-click=\"toggle($event)\"\n      id=\"{{ssId}}\" ng-disabled=\"ngDisabled\"\n      type=\"button\" class=\"btn dropdown-toggle btn-default\">\n        <span data-ng-show=\"!value\" class=\"filter-option pull-left\">{{placeholder}}</span>\n        <span data-ng-show=\"value\" class=\"filter-option pull-left\">{{title}}</span>\n        &nbsp;<span class=\"caret\"></span>\n    </button>\n\n    <div ng-show=\"opened\" class=\"dropdown-menu\">\n        <div class=\"bs-searchbox\">\n            <input ng-model=\"filter\" ng-click=\"noop($event)\" type=\"text\"\n              class=\"input-block-level form-control\" autocomplete=\"off\" />\n        </div>\n        <ul ng-show=\"opened\" class=\"dropdown-menu inner\"\n          style=\"display: block; overflow-y: auto; min-height: 0px;\"\n          ng-style=\"{ \'max-height\': ssHeight + \'px\' }\">\n            {{ select(selected, (selected >= 0 && index === -1)) }}\n            <li ng-repeat=\"item in items | filter: filter\"\n              ng-class=\"{ active: (index == $index) }\">\n                {{ select($index, (index === -1 && item[key] == value)) }}\n                <a ng-click=\"select($index)\">{{item[content]}}</a>\n            </li>\n        </ul>\n    </div>\n</div>");}]);