// CANVAS

var margin = {t:50,r:100,b:50,l:75};
var width = document.getElementById('plot').clientWidth - margin.r - margin.l,
    height = document.getElementById('plot').clientHeight - margin.t - margin.b;

var plot = d3.select('#plot')
    .append('svg')
    .attr('width',width+margin.r+margin.l)
    .attr('height',height + margin.t + margin.b)
    .append('g')
    .attr('class','canvas')
    .attr('transform','translate('+margin.l+','+margin.t+')');


var width2 = document.getElementById('plot2').clientWidth - margin.r - margin.l,
    height2 = document.getElementById('plot2').clientHeight - margin.t - margin.b;

var plot2=d3.select('#plot2')
    .append('svg')
    .attr('width',width2+margin.r+margin.l)
    .attr('height',height2 + margin.t + margin.b)
    .append('g')
    .attr('class','main-graph')
    .attr('transform','translate('+margin.l+','+margin.t+')');


//Formats
var dateFormat = d3.time.format('%Y-%m-%d');
var yearformat = d3.time.format("%Y");
var numberformat = d3.format(",");

// SCALES FIRST GRAPH
var startDate = new Date(2002,1,1),
    endDate = new Date(2015,9,1);
var scaleX = d3.time.scale().domain([startDate,endDate]).range([0, width]),
    scaleY = d3.scale.linear().domain([0,2000000]).range([height,0])
    scaleColorBars = d3.scale.ordinal().range(["#d62d2d","#a12f37","#6c3142","013456","36324c"]);

//Axis1
var axisX1 = d3.svg.axis()
    .scale(scaleX)
    .tickFormat(dateFormat)
    .ticks(d3.time.months)
    .tickSize(5)
    .tickValues(9)
    .orient("bottom");

var axisX2 = d3.svg.axis()
    .scale(scaleX)
    .ticks(d3.time.years, 1)
    .tickFormat(yearformat)
    .tickSize(0)
    .orient("bottom");


var axisY = d3.svg.axis()
    .orient('left')
    .tickSize(-width)
    .scale(scaleY);

//Draw Axis1
plot.append('g')
    .attr('class','axis axis-x')
    .attr('transform','translate(0,'+height2+')')
    .call(axisX1);

plot.append('g')
    .attr('class','axis axis-x')
    .attr('transform','translate(0,'+(height2+25)+')')
    .call(axisX2);

plot.append('g')
    .attr('class','axis axis-y')
    .call(axisY);


// SCALES SECOND GRAPH
var scaleR = d3.scale.sqrt().domain([0,391835]).range([2,100]),
    scaleColor= d3.scale.ordinal().domain(["America", "Europe","Asia", "Africa","Oceania"]).range(["#d62d2d","#a12f37","#6c3142","36324c","013456"]);


//Import
queue()
    //.defer(d3.json,"/data/map.json", parseMap)
    .defer(d3.csv,'/data/spaniards_registered_abroad-CERA.csv',parseData)
    .defer(d3.csv,'/data/spaniards_registered_abroad-CERA_continents.csv',parseDataCont)
    .await(dataLoaded);

//Generators
//TODO: set up a mercator projection, and a d3.geo.path() generator
//Center the projection at the center of Boston

/*var projection = d3.geo.mercator()
    .center(0,0)
    .translate([(width/2)-75,height/2])
    .scale(200000);

var path = d3.geo.path().projection(projection);*/



var projection = d3.geo.mercator()
    .scale((width + 1) / 2 / Math.PI)
    .translate([width / 2, height / 2])
    .precision(.1);

var path = d3.geo.path()
    .projection(projection);

//PARSE
function parseData (d) {


    return {
        year: +d["Year"],
        month: d["Month"],
        date: new Date (d["Date"]),
        continent: d["Continent"],
        country: d["Country of residence"],
        consulate: d["Consulate"],
        spaniards: +d["Spaniards"],
    };
}

function parseDataCont (c) {
    //console.log(c)

    return {
        date: new Date (c["Date"]),
        America: +c["America"],
        Europe: +c["Europe"],
        Asia: +c["Asia"],
        Africa: +c["Africa"],
        Oceania: +c["Oceania"],
    };
}

function parseMap (world){
    console.log(world)
    var countries = topojson.feature(world, world.objects.countries).features,
        neighbors = topojson.neighbors(world.objects.countries.geometries);
}



//DataLoaded - nestedData
function dataLoaded (error,data,perCont) {
    /*d3.json("/data/countries.json", function(error, world) {
        //d.latlng: Array[2]
        console.log(world)
        var countries = topojson.feature(world, world.objects.countries).features,
            neighbors = topojson.neighbors(world.objects.countries.geometries);

        plot2.selectAll(".country")
            .data(countries)
            .enter().insert("path", ".graticule")
            .attr("class", "country")
            .attr("d", path)
            .style("fill", function(d, i) {
               if (d.id == 50) {
                   console.log(d);return "red"
               } else if (d.id==51) {return "blue"}
                else if (d.id==52){return "yellow"}
                else if(d.id==53){return "green"}
            });
    });*/


    //TODO PLOT 1 - EVOLUTION PER YEAR AND CONTINENT STACKED BARS
    //console.log(perCont[0]);
    scaleColorBars.domain(d3.keys(perCont[0]).filter(function(key) { return key !== "date"; }));

    perCont.forEach(function(d) {
        var y0 = 0;
        d.places = scaleColorBars.domain().map(function(name) {
            return {name: name, y0: y0, y1: y0 += +d[name],totals: +d[name],month: d.date}; });
        d.totalSpaniards = d.places[d.places.length - 1].y1;
    });
    perCont.sort(function(a, b) {return a.totalSpaniards - b.totalSpaniards});

    plot = plot.append("g").attr("class", "graph1")
        .attr('transform','translate('+5+',0)');

    var graph1 = plot.selectAll(".dates")
        .data(perCont)
        .enter()
        .append("g")
        .attr("class", "dates")
        .attr("transform", function (d) {
            return "translate(" + scaleX(d.date) + ",0)";
        })
        .on("mouseenter", function(d) {
            var tooltip = d3.select(".custom-tooltip");
            tooltip.transition().style("opacity", 1);
            tooltip.select("#total").html(numberformat(d.totalSpaniards));
        })
        .on("mouseleave", function(d){
            d3.select(".custom-tooltip").transition() //hide data from the tooltip
                .style("opacity",0);
        });


    graph1.selectAll(".continents")
        .data(function (d){return d.places})
        .enter()
        .append('rect')
        .attr("class","continents")
        .attr("width", "0px")
        .style('opacity',0.65)
        .attr("y", function (d,i){
            //console.log(d);
            return scaleY(d.y1)})
        .attr("height", 0)
        .on("mouseenter", function(d) {
            d3.select(this).style('opacity', 1);
            //console.log(d.date+","+result);
            var tooltip = d3.select(".custom-tooltip");
            tooltip.transition().style("opacity", 1);
            dateFormat2 = d3.time.format('%B-%Y');
            tooltip.select("#date").html(dateFormat2(d.month));
            tooltip.select("#place").html(d.name);
            tooltip.select("#number1").html(numberformat(d.totals))
        })
        .on("mouseleave", function(d){
            d3.select(this).style('opacity',0.65);
            d3.select(".custom-tooltip").transition()
                .style("opacity",0);
        })

        .on("mousemove", function(d){
            d3.select(this).style('opacity',1);

            var xy = d3.mouse(document.getElementById("plot")); // tooltip to move with mouse movements
            var left = xy[0],
                top = xy[1];
            d3.select(".custom-tooltip")
                .style("left", left+75+ "px")
                .style("top", top +75+ "px")
        })
        .transition()
        .duration(1000)
        .attr("width", "5px")
        .attr("height", function(d){return scaleY(d.y0)-scaleY(d.y1)})
        .style("fill", function (d){
            return scaleColor(d.name)});

    //console.log("data", data);
    data.sort(function(a, b) { return a.date - b.date || b.spaniards - a.spaniards}); //sort by date, then by spaniards
    //console.log("data", data);
    //TODO PLOT 1 - EVOLUTION PER YEAR

    //nest by year
    var dataSepOnly = data.filter(function(d))

    //console.log("by years", nestedData);


    var nestedDataYear = d3.nest()
        .key(function (d){
            if ((d.month=="September")) {return true}else{return false}})
        .key(function (d){
            return d.date
        })
        .key(function (d){return d.continent})
        .key(function (d){return d.country})
        .rollup(function(d) {
            return {continent: d.continent,
            "total_sum":d3.sum(d, function(g) {return g.spaniards; })}})// roll up = sum | total spaniards per year and month
        .entries(data);
    nestedDataYear.shift();
    nestedYear = nestedDataYear[0].values;




//TODO PLOT 2
// I WANT TO DRAW A MERCATOR MAP
    var graph2 = plot2.selectAll(".regions")
        .data(nestedYear)
        .enter()
        .append("g")
        .attr("class", "regions");

    graph2.selectAll(".countries")
        .data(nestedYear)
        .enter()
        .append("circle")
        .attr("class", "countries")
        .attr("r", function(d,i){
            console.log(d) // max size is from Argentina 391835
            console.log("countries", d.values[i].values.total_sum);
            radius = d.values[i].values.total_sum;
            return scaleR(radius);
        })
        .style("fill", scaleColor())
        .attr("cx", function (d){
            d3.json("/data/countries.json", function(error, world) {
                console.log(world[latlng])
                var x = function (world,i){return world[i].latlng[0]};
                var y = function (world,i){return world[i].latlng[1]};
                //console.log("x",x)
                //console.log("y",y)
                //d.latlng: Array[2]
                //console.log("hello", world[i].latlng)
            })

        })


}
