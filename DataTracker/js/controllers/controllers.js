
'use strict';


/* Controllers */

var mod_ds = angular.module('DatasetControllers', ['ui.bootstrap', 'angularFileUpload','ui.select2']);

var projectsController = ['$scope', 'DataService',
	function(scope, DataService){
		scope.projects = DataService.getProjects();

        var linkTemplate = '<div class="ngCellText" ng-class="col.colIndex()">' + 
                               '<a href="#/projects/{{row.getProperty(\'Id\')}}">{{row.getProperty("Name")}}</a>' +
                               '</div>';

        scope.gridOptions = {
            data: 'projects',
            columnDefs:
            [
                {field: 'Name', displayName: 'Project Name', width: '35%', cellTemplate: linkTemplate},
                {field: 'Description', displayName: 'Description'}
            ]
        }

	}
];


var projectDatasetsController = ['$scope', '$routeParams', 'DataService',
	function(scope, routeParams, DataService){
		scope.datasets = DataService.getProjectDatasets(routeParams.Id);
        scope.project = DataService.getProject(routeParams.Id);
        scope.currentUserId = 1; /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        scope.filteredUsers = false;
		var linkTemplate = '<div class="ngCellText" ng-class="col.colIndex()">' + 
            				   '<a href="#/activities/{{row.getProperty(\'Id\')}}">{{row.getProperty("Name")}}</a>' +
            				   '</div>';

        var activityTemplate = '<div class="ngCellText" ng-class="col.colIndex()">' + 
            				   '1/10/2014 @ 8:20 AM by Ken Burcham' +
            				   '</div>';

		scope.gridOptions = {
            	data: 'datasets',
            	columnDefs: 
            		[
            			{field:'Name', displayName:'Dataset Name', cellTemplate: linkTemplate},
            			{field:'Description',displayName: 'Description'},    
            			{field:'CreateDate',displayName: 'Last Activity', cellTemplate: activityTemplate}
            		]	
            };

        var fileLinkTemplate = '<a href="{{row.getProperty(\'Link\')}}">' +
                                '<img src="{{row.getProperty(\'Link\')}}"" width="150px"/><br/><div class="ngCellText" ng-class="col.colIndex()">' + 
                               '{{row.getProperty("Name")}}</a>' +
                               '</div>';

        var uploadedBy = '<div class="ngCellText" ng-class="col.colIndex()">' + 
                               '{{row.getProperty("UploadDate")|date}} by {{row.getProperty("User.Fullname")}}' +
                               '</div>';                               

        scope.gridFiles = {
            data: 'project.Docs',
            columnDefs:
            [
                {field:'Name',displayName: 'File Name', cellTemplate: fileLinkTemplate},
                {field: 'Title'},
                {field: 'Description'},
                {field: 'Uploaded', displayName: "Uploaded", cellTemplate: uploadedBy},
                {field: 'Size'},
            ]
        };

        scope.gridGallery = {
            data: 'project.Images',
            columnDefs:
            [
                {field:'Name',displayName: 'File Name', cellTemplate: fileLinkTemplate},
                {field: 'Title'},
                {field: 'Description'},
                {field: 'Uploaded', displayName: "Uploaded", cellTemplate: uploadedBy},
                {field: 'Size'},
            ]
        };

         scope.users = [];
         scope.$watch('project.Id', function(){
            if(scope.project && scope.project.Id)
            {
                scope.editors = scope.project.Editors;
                scope.users = DataService.getUsers();

                scope.project.MetadataValue = {};
                scope.project.Images = [];
                scope.project.Docs = [];
                angular.forEach(scope.project.Metadata, function(property, key){
                    scope.project.MetadataValue[property.MetadataPropertyId] = property.Values;
                });

                //split out the images and other files.
                
                angular.forEach(scope.project.Files, function(file, key){
                    if(file.FileType.Name=="Image")
                        scope.project.Images.push(file);
                    else
                        scope.project.Docs.push(file);
                });
                

            }

         });

        scope.clearUsersWatch = scope.$watch('users', function(){
                if(scope.users)
                {
                    if(scope.users.length > 0)
                    {
                        scope.clearUsersWatch();
                        scope.filterUsers();
                    }
                }
                else
                    console.log("not yet.");

        },true); //note this TRUE here... this is required when watching an array directly.

        //remove this editor from the users dropdown.
        scope.filterUsers = function()
        {
            console.log("filterusers starting with " + scope.users.length);

            var newusers = [];
            
            for (var a = 0; a < scope.users.length; a++) {
                var user = scope.users[a];
                var filterOut = false;

                for (var i = 0; i < scope.editors.length; i++) {
                    //is this user an editor already?  if so leave them off the list.
                    if(scope.editors[i].Id == user.Id)
                    {
                        filterOut = true;
                        break;
                    }
                }  

                if(!filterOut)
                    newusers.push(user);
                   

            };

            console.log("set a new group: " + newusers.length);
            scope.users = newusers.sort(orderUserByAlpha);

         }

         scope.select2Options = {
            allowClear:true
         };

         scope.selectedUser = null;

         scope.addEditor = function(){
            console.log("Add Editor.");
            for (var i = 0; i < scope.users.length; i++) {
                var user = scope.users[i];

                if(user.Id == scope.selectedUser)
                {
                    scope.editors.push(user);
                    scope.users.splice(i,1);
                    scope.selectedUser = null;
                    break;
                }
            };
         };

         scope.removeEditor = function(index)
         {
            scope.users.push(scope.editors.splice(index,1)[0]);
            scope.users.sort(orderUserByAlpha);
         };

         scope.saveEditors = function()
         {
            scope.saveResults = {};
            DataService.saveEditors(scope.currentUserId, scope.project.Id, scope.editors, scope.saveResults);
         };

         scope.cancel = function()
         {
           // scope.users = 
         };

	}
];


mod_ds.controller('ProjectsCtrl', projectsController);
mod_ds.controller('ProjectDatasetsCtrl', projectDatasetsController);


mod_ds.filter('mapStatus', function( StatusesConstant ) {
  return function(input) {
    if (StatusesConstant[input]) {
      return StatusesConstant[input];
    } else {
      return 'unknown';
    }
  };
})
.factory( 'StatusesConstant', function() {
  return {
    1: 'Ok',
    2: 'Flagged'
  };
});

mod_ds.factory('ActivityQAStatusesConstant', function(){
	return {
		5:"Ready for QA",
		6:"Approved",
		7:"Needs Review",
	};
});


