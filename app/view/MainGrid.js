Ext.define('SpWebPortal.view.MainGrid', {
    extend: 'Ext.grid.Panel',
    xtype: 'spmaingrid',
    alias: 'widget.spmaingrid',

    //localizable strings...
    mapBtnHint: "map",
    detailsBtnHint: "details",
    // ...localizable strings

    requires: [
	'SpWebPortal.model.AttachedImageModel'
    ],

    config: {
	showMapAction: true,
	isDetail: false,
	geoCoordFlds: [],
	imgFld: null
    },

    isGeoCoordFld: function(coldef) {
	var fld = coldef.get('spfld').toLowerCase();
	return fld == 'latitude1' || fld == 'latitude2' 
	    || fld == 'lat1text' || fld == 'lat2text'
	    || fld == 'longitude1' || fld == 'longitude2' 
	    || fld == 'long1text'  || fld == 'long2text';
    },

    processGeoCoordFld: function(coldef, geoCoordFlds) {
	var fld = coldef.get('spfld').toLowerCase();
	if (fld == 'latitude1') {
	    geoCoordFlds[0] = coldef.get('solrname');
	} else if (fld == 'longitude1') {
	    geoCoordFlds[1] = coldef.get('solrname');
	}
	else if (fld == 'latitude1') {
	    geoCoordFlds[2] = coldef.get('solrname');
	}
	else if (fld == 'longitude2') {
	    geoCoordFlds[3] = coldef.get('solrname');
	}
    },

    isGoodPlaceForMapBtn: function(coldef) {
	//assuming lat is present also, and that long cols are to right of lats, 
	//position to right of long col is good for Map ctrl
	var fld = coldef.get('spfld').toLowerCase();
	return fld == 'longitude1' || fld == 'longitude2' || fld == 'long1text'  || fld == 'long2text';
    },

    isDefaultFldOnMap: function(fld) {
	var lfld = fld.toLowerCase();
	return lfld == 'catalognumber' || lfld == 'localityname';
    },

    defaultFldsOnMap: function(fieldStore, fldsOnMap) {
	//default fields to display in popups on maps
	//assumes fldsOnMap is empty array
	for (var f = 0; f < fieldStore.count(); f++) {
	    var colDef = fieldStore.getAt(f);
	    var fld = colDef.get('spfld');
	    if (this.isDefaultFldOnMap(fld)) {
		fldsOnMap[fldsOnMap.length] = [colDef.get('solrname'), colDef.get('title')];
	    }
	}   
    },

    defaultMapMarkerTitle: function(fieldStore) {
	for (var f = 0; f < fieldStore.count(); f++) {
	    var colDef = fieldStore.getAt(f);
	    var fld = colDef.get('spfld');
	    if (this.isDefaultFldOnMap(fld)) {
		return [colDef.get('solrname'), colDef.get('title')];
	    }
	} 

	var defs = [];
	this.defaultFldsOnMap(fieldStore, defs);   
	if (defs.length > 0) {
	    return defs[0];
	}

	return [];
    },

    isImageCol: function(colDef) {
	return colDef.get('solrname') == 'img';
    },

    initComponent: function() {
	console.info('MainGrid initComponent()');
	var fieldStore = Ext.getStore('FieldDefStore');
	var tblCols = [];
	tblCols[0] = Ext.create('Ext.grid.RowNumberer', {width: 30, resizable: true});
	var mapColPos = -1;
	this.geoCoordFlds = []; //Lat1,Long1,Lat2,Long2...
	var fldsOnMap = []; //flds displayed on popup labels in map view
	var mapMarkerTitleFld = [];
	var hasImages = false, hasMaps = false;
	for (var r = 1; r < fieldStore.count(); r++) {
	    var colDef = fieldStore.getAt(r);
	    var col = Ext.create('Ext.grid.column.Column', {
		text: colDef.get('title'),
		dataIndex: colDef.get('solrname'),
		hidden: colDef.get('hiddenbydefault'),
		sortable: colDef.get('advancedsearch'),
		width: 100
	    });
	    if (this.isImageCol(colDef)) {
		hasImages = true;
		this.imgCol = colDef.get('solrname');
		col.renderer = function(value) {
		    var result = '';
		    if (value != null && value != '') {
			var data = Ext.JSON.decode(value);
			var store = Ext.create('Ext.data.Store', {
			    model: 'SpWebPortal.model.AttachedImageModel',
			    data: data
			});
			
			for (var r = 0; r < store.getCount(); r++) {
			    if (result != '') {
				result += ', ';
			    }
			    result += store.getAt(r).get('Title');
			}
		    }
		    return result;
		}
	    }
	    if (this.getShowMapAction()) {
		if (this.isGeoCoordFld(colDef)) {
		    this.processGeoCoordFld(colDef, this.geoCoordFlds);
		    if (this.isGoodPlaceForMapBtn(colDef)) {
			mapColPos = r+1;
		    }
		}
		if (colDef.get('displayinmap') || colDef.get('mapmarkertitle')) {
		    fldsOnMap[fldsOnMap.length] = [colDef.get('solrname'), colDef.get('title')];
		    if (colDef.get('mapmarkertitle') && mapMarkerTitleFld.length == 0) {
			mapMarkerTitleFld =  [colDef.get('solrname'), colDef.get('title')];
			console.info("set map marker title: " + mapMarkerTitleFld);
		    }
		}
	    }
	    tblCols[r] = col;
	}
	//Dropping the map action item just indicating presence/absence of coords with icon, details btn displays map
	hasMaps = mapColPos != -1;
	if (mapColPos != -1) {
	    if (fldsOnMap.length == 0) {
		this.defaultFldsOnMap(fieldStore, fldsOnMap);
	    }
	    if (mapMarkerTitleFld.length == 0) {
		mapMarkerTitleFld = this.defaultMapMarkerTitle(fieldStore);
		console.info("set map marker title to default: " + mapMarkerTitleFld);
	    }
	    this.fireEvent('mapsetsready', this.geoCoordFlds, fldsOnMap, mapMarkerTitleFld);
	    //Dropping the map action item just indicating presence/absence of coords with icon, details btn displays map
	    /*var mapCol = Ext.create('Ext.grid.column.Action', {
		//text: "Map",
		sortable: false,
		width: 25,
		itemid: 'map-popup-ctl',
		geoCoordFlds: geoCoordFlds,
		fldsOnMap: fldsOnMap,
		mapMarkTitleFld: mapMarkerTitleFld,
		items: [{
		    icon: 'resources/images/GoogleEarth16x16.png',
		    tooltip: this.mapBtnHint,
		    handler: function(grid, rowIndex) {
			var record = grid.getStore().getAt(rowIndex);
			this.fireEvent('clicked', record, this.geoCoordFlds, this.fldsOnMap, this.mapMarkTitleFld);
			//testing page map display...
			//var records = [];
			//for (var r = 0; r < 10; r++) {
			//    records[r] = grid.getStore().getAt(rowIndex + r);
		//	}
			//this.fireEvent('clicked', records, this.geoCoordFlds, this.fldsOnMap, this.mapMarkTitleFld);
		    }
		}]

	    });
	    tblCols.splice(mapColPos, 0, mapCol);*/
	}
	var isDet = this.getIsDetail();
	var detailCol = Ext.create('Ext.grid.column.Action', {
	    sortable: false,
	    width: 25,
	    itemid: 'detail-popup-ctl',
	    items: [
		{
		    icon: 'resources/images/SearchBoxMac.gif',
		    tooltip: this.detailsBtnHint,
		    handler: function(grid, rowIndex) {
			this.fireEvent('clicked', grid.getStore().getAt(rowIndex), isDet, rowIndex);
		    },
		},
	    ]
	});
	/*var geoCol = Ext.create('Ext.grid.column.Column', {
	    renderer: this.renderGeoCol,
	    width: 16
	});
	var imgPresCol = Ext.create('Ext.grid.column.Column', {
	    renderer: this.renderImgPresCol,
	    width: 16
	});*/
	var geoImgPresCol = Ext.create('Ext.grid.column.Column', {
	    renderer: this.renderGeoImgPresCol,
	    width: 32
	});
	tblCols.splice(1, 0, detailCol);
	//tblCols.splice(2, 0, geoCol);
	//tblCols.splice(3, 0, imgPresCol);
	tblCols.splice(2, 0, geoImgPresCol);
	this.columns = tblCols;

	this.store.setGeoCoordFlds(this.geoCoordFlds); 

	this.callParent(arguments);
    },

    hasGeo: function(value, grid, record) {
	for (var i=0; i < this.geoCoordFlds.length; i++) {
	    if (!this.isMappable(record.data[this.geoCoordFlds[i]])) {
		return false;
	    }
	}
	return true;
    },

    renderGeoCol: function(value, grid, record) {
	if (this.hasGeo(value, grid, record)) {
	    return '<img src="resources/images/GoogleEarth16x16.png" height="12" width="12">';
	} else {
	    return "";
	}
    },

    isMappable: function(geoCoord) {
	if (geoCoord == null) return false;
	
	if (typeof geoCoord == "string") return geoCoord.trim() != "";
	
	return true;
    },

    hasImg: function(value, grid, record) {
	var val =  record.data[this.imgCol];
	if (typeof val !== "undefined" && val != null && val.length > 0) {
	    return true;
	} else {
	    return false;	
	}
    },
    
    renderImgPresCol: function(value, grid, record) {
	if (this.hasImg(value, grid, record)) {
	    return  '<img src="resources/images/ImageWindow20x20.png" height="12" width="12">';
	} else {
	    return "";
	}
    },

    renderGeoImgPresCol: function(value, grid, record) {
	return this.renderGeoCol(value, grid, record) + this.renderImgPresCol(value, grid, record);
    }

});

