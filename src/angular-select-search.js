angular.module('selectSearch', ['vs-repeat'])
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
            , ngChange: '&'

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
            $scope.length = $scope.itemsAll ? $scope.itemsAll.length : 0;
            $scope.content = $scope.content || 'title';
            $scope.key = $scope.key || 'value';
            $scope.placeholder = $scope.placeholder || '';
            $scope.index = -1;
            if($scope.value && $scope.itemsAll){
                var selected;
                for(var idx in $scope.itemsAll){
                    if($scope.itemsAll[idx][$scope.key] == $scope.value){
                        selected = $scope.itemsAll[idx];
                        break;
                    }
                }
                $scope.title = selected[$scope.content];
            }

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
                if($scope.items[index] && $scope.value != $scope.items[index][$scope.key]){
                    $scope.ngChange();
                }
                if (!angular.isDefined($scope.items[index])) {
                    return;
                }
                $scope.value = $scope.itemsAll[index][$scope.key];
                $scope.title = $scope.itemsAll[index][$scope.content];
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
                $timeout(function () {
                    $scope.moveScroll();
                },0);
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
                        angular.element($window).bind('keyup', $scope.keyup);
                    }
                    else {
                        angular.element($window).unbind('keydown', $scope.keydown);
                        angular.element($window).unbind('keyup', $scope.keyup);
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
                $timeout(function () {
                    $scope.moveScroll();
                },0);
            };
            $scope.keyup = function(ev) {
                $timeout(function () {
                    $scope.moveScroll();
                },0);
            };

            $scope.down = function() {
                if ($scope.index + 1 < $scope.items.length) {
                    $scope.index++;
                    $scope.$apply();
                    $timeout(function () {
                        $scope.moveScroll();
                    },0);
                }
            };

            $scope.up = function() {
                var newIndex = $scope.index - 1;
                if ($scope.index - 1 >= 0) {
                    $scope.index -= 1;
                    $scope.$apply();
                    $timeout(function () {
                        $scope.moveScroll();
                    },0);
                }
            };

            $scope.moveScroll = function() {
                if($scope.index >= 0){
                    $scope.$broadcast('vsRepeatTrigger',{scrollIndex:$scope.index,scrollIndexPosition:'inview#auto'});
                }
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