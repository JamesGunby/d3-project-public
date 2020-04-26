/*James Gunby - B00713142*/
/*CSCI4166 Final Project*/
/*This JS file creates the line chart displayed in the tool.*/


//Global Variables are declared. There are accessed by the functions. Global variables used to ensure
//that data can be updated when the user makes parameter changes to the tool.
let lcData;
let lcGlobalData;
let countries = ["United States", "Canada", "United Kingdom", "Mexico", "France", "Germany", "Russia", "Spain", "Egypt",
"South Africa", "Brazil", "Japan", "China", "Ecuador", "Nigeria", "Ethiopia", "Jamaica", "Argentina", "Chile", "South Korea",
"Sweden", "Finland", "Iceland", "Australia", "New Zealand", "Italy", "Greece", "Turkey", "Thailand"];
let lineChartSVG;

let globalAvgLine;
let selectedCountryLine;
let xAxis;
let yAxis;

const lcYearRange = [];
let lcYearToAdd = 1920;
while (lcYearToAdd <= 2015) {
    lcYearRange.push("" + lcYearToAdd);
    lcYearToAdd++;
}

let infoAreaSVG;
let monthYearText;
let globalAvgText;
let selectedCountryText;

countries.forEach((country) => {
   const option = document.createElement("option");
   option.text = country;
   option.value = country;
   if (country === "Canada") {
       option.selected = true;
   }
   document.getElementById("lineChartCountrySelect").add(option);
});

d3.json("/GlobalLandTemperaturesByCountryReduced.json").then((readData) => {
    lcData = readData;

    d3.json("/GlobalTemperaturesReduced.json").then((readGlobalData) => {
        lcGlobalData = readGlobalData;

        //Line graph's SVG is created
        lineChartSVG = d3.select("#lineGraph").append("svg")
            .attr("width", 1350)
            .attr("height", 350)
            .attr("background", "white")
            .attr("transform", "translate(25, 0)")
            .append("g");

        //Creates the colour legend for the line chart
        lineChartSVG.append("circle")
            .attr("cx", 960)
            .attr("cy", 25)
            .attr("r", 10)
            .style("fill", "darkblue");
        lineChartSVG.append("text")
            .attr("fill", "black")
            .text("Global Avg.")
            .attr("transform", "translate(975, 30)");
        lineChartSVG.append("circle")
            .attr("cx", 1100)
            .attr("cy", 25)
            .attr("r", 10)
            .style("fill", "darkgreen");
        lineChartSVG.append("text")
            .attr("fill", "black")
            .text("Selected Country Avg.")
            .attr("transform", "translate(1115, 30)");

        xAxis = d3.scaleLinear()
            .domain([1920, 2013])
            .range([0, 1300]);
        lineChartSVG.append("g")
            .attr("transform", "translate(25, 175)")
            .call(d3.axisBottom(xAxis));

        yAxis = d3.scaleLinear()
            .domain([-40.0, 40.0])
            .range([325, 25]);
        lineChartSVG.append("g")
            .attr("transform", "translate(25, 0)")
            .call(d3.axisLeft(yAxis));

        globalAvgLine = lineChartSVG.append("path")
            .attr("transform", "translate(25,0)");
        selectedCountryLine = lineChartSVG.append("path")
            .attr("transform", "translate(25,0)");

        //Creates the SVG that will display the mouse hover-over information.
        infoAreaSVG = d3.select("#lineGraphInfoArea")
            .append("svg")
            .attr("width", 1500)
            .attr("height", 70);

        monthYearText = infoAreaSVG
            .append("text")
            .attr("class", "hoveredCountryText")
            .attr("transform", "translate(635, 35)");

        globalAvgText = infoAreaSVG
            .append("text")
            .attr("class", "hoveredCountryText")
            .attr("transform", "translate(835, 35)");

        selectedCountryText = infoAreaSVG
            .append("text")
            .attr("class", "hoveredCountryText")
            .attr("transform", "translate(1100, 35)");

        updateLine();
    });
});

//When the user changes selected country or month, this is called to update the lines accordingly.
function updateLine() {
    if (globalAvgLine && selectedCountryLine) {
        const monthSelector = document.getElementById("lineChartMonthSelect");
        const month = monthSelector.options[monthSelector.selectedIndex].value;
        const monthAsNumber = moment().month(month).format("MM");
        const monthAsNumberSingle = moment().month(month).format("M");

        const countrySelector = document.getElementById("lineChartCountrySelect");
        const country = countrySelector.options[countrySelector.selectedIndex].value;

        const filteredCountryData = lcData.filter(row => {
            return row.dt.includes(`-${monthAsNumber}-01`) && row.Country === country;
        });

        const filteredGlobalAvgData = lcGlobalData.filter(row => {
            return (row.dt.includes(`-${monthAsNumber}-01`) || row.dt.startsWith(`${monthAsNumberSingle}/1/`));
        });

        globalAvgLine.datum(filteredGlobalAvgData)
            .attr("fill", "none")
            .attr("stroke", "darkblue")
            .attr("stroke-width", 2)
            .attr("d", d3.line()
                .x(function (d) {
                    return xAxis(parseInt(moment(d.dt).format("YYYY").toString()));
                })
                .y(function (d) {
                    return yAxis(parseFloat(d.LandAverageTemperature));
                })
            );

        selectedCountryLine.datum(filteredCountryData)
            .attr("fill", "none")
            .attr("stroke", "darkgreen")
            .attr("stroke-width", 2)
            .attr("d", d3.line()
                .x(function (d) {
                    return xAxis(parseInt(moment(d.dt).format("YYYY").toString()));
                })
                .y(function (d) {
                    return yAxis(parseFloat(d.AverageTemperature));
                })
            );

        const globalLineFocus = lineChartSVG.append("g")
            .attr("fill", "darkblue")
            .style("display", "none");

        const selectedLineFocus = lineChartSVG.append("g")
            .attr("fill", "darkgreen")
            .style("display", "none");

        globalLineFocus.append("circle")
            .attr("r", 5);

        selectedLineFocus.append("circle")
            .attr("r", 5);

        //A rect is appended to gather mouse-positioning information for scroll-over.
        lineChartSVG.append("rect")
            .attr("width", 1307)
            .attr("height", 314)
            .attr("fill", "none")
            .attr("transform", "translate(25, 25)")
            .attr("pointer-events", "all")
            .on("mouseover", () => {
                globalLineFocus.style("display", null);
                selectedLineFocus.style("display", null);
            })
            .on("mouseout", () => {
                globalLineFocus.style("display", "none");
                selectedLineFocus.style("display", "none");

                monthYearText
                    .text("");

                globalAvgText
                    .text("");

                selectedCountryText
                    .text("");
            })
            .on("mousemove", () => {
                const bisector = d3.bisector((d) => {
                    return parseInt(moment(d.dt).format("YYYY").toString());
                }).left;

                //A position is gathered and a bisector is used to determine what year the mouse is approximately over
                //on the chart. The bisector returns a value that corresponds to the appropriate array position.
                const pos = xAxis.invert(d3.mouse(d3.event.currentTarget)[0]);
                const globalIndex = bisector(filteredGlobalAvgData, pos, 1);
                const selectedIndex = bisector(filteredCountryData, pos, 1);

                //Because mouse positioning can be somewhat ambiguous, the following calculations are done to determine
                //between two potential array indexes.
                const gdPrev = filteredGlobalAvgData[globalIndex - 1];
                const gdAt = filteredGlobalAvgData[globalIndex];
                const sdPrev = filteredCountryData[selectedIndex - 1];
                const sdAt = filteredCountryData[selectedIndex];
                const gd = pos - parseInt(moment(gdPrev.dt).format("YYYY").toString())
                    > parseInt(moment(gdPrev.dt).format("YYYY").toString()) - pos
                    ? gdAt : gdPrev;
                const sd = pos - parseInt(moment(sdPrev.dt).format("YYYY").toString())
                > parseInt(moment(sdPrev.dt).format("YYYY").toString()) - pos
                    ? sdAt : sdPrev;

                //Circles are moved to the mouse position on the lines.
                globalLineFocus.attr("transform", "translate(" + (25 + xAxis(parseInt(moment(gd.dt).format("YYYY").toString())))
                + ", " + yAxis(parseFloat(gd.LandAverageTemperature)) + ")");
                selectedLineFocus.attr("transform", "translate(" + (25 + xAxis(parseInt(moment(sd.dt).format("YYYY").toString())))
                    + ", " + yAxis(parseFloat(sd.AverageTemperature)) + ")");

                monthYearText
                    .text(() => {
                        return month + " " + moment(gdPrev.dt).format("YYYY").toString();
                    });

                globalAvgText
                    .text(() => {
                        return "Global Avg: " + parseFloat(gd.LandAverageTemperature).toFixed(2) + "°C";
                    });

                selectedCountryText
                    .text(() => {
                        return sd.Country + " Avg: " + parseFloat(sd.AverageTemperature).toFixed(2) + "°C";
                    });
            });
    }
}

