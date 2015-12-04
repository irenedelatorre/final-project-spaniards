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
//
var partition =  d3.layout.partition()
    .size([width,height]) //how big is ALL the rectangle (with subdivisions)
    .children (function(d){
    // given the hieararchy data, how to go down the tree
    return (d.values);
})
    .value(function(d){
        return (d.year)
    })
    .sort(function (a,b){
        return a.key - b.key;
    });

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

//TODO PLOT 2
    //nest by year
    var dataSepOnly = data.filter(function(d){if ((d.month=="September")) {return true}else{return false}});
    console.log(dataSepOnly);

    var nestedData = d3.nest()
        .key(function (d){return d.year})
        .key(function(d){return d.continent})
        .key(function(d){return d.country})
        .entries(dataSepOnly);


    nestedData.forEach(function(eachYear) {
            eachYear.values.forEach(function(eachContinent){
                    eachContinent.values.forEach(function(eachCountry){
                            /*spainiards_values = eachCountry.values.map(function(d){
                                   return d;
                                }
                            )
                            sum_county = d3.sum(spainiards_values, function(d){
                                return d.spaniards;
                            })
                            eachCountry.total = sum_county;*/



                            eachCountry.total = d3.sum(eachCountry.values.map(function(d){
                                    return d;
                                }
                            ), function(d){
                                return d.spaniards;
                            });
                        }

                    )

                }

            )
        }


    );

    console.log(nestedData);





// I WANT TO DRAW A TREEMAP
    var hierarchy = {
        key: "year",
        values: nestedData
    };


}
