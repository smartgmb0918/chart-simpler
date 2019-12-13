const dims = { height: 300, width: 300, radius: 150 };
const cent = { x: (dims.width / 2 + 5), y: (dims.height / 2 + 5) };

const svg = d3.select('.canvas-0')
  .append('svg')
  .attr('width', dims.width + 150)
  .attr('height', dims.height + 150);

const graph = svg.append('g')
  .attr('transform', `translate(${cent.x}, ${cent.y})`);

const pie = d3.pie()
  .sort(null)
  .value(d => d.cost);

const arcPath = d3.arc()
  .outerRadius(dims.radius)
  .innerRadius(dims.radius / 2);

const color = d3.scaleOrdinal(d3['schemeSet3']);

// legend setup
const legendGroup = svg.append('g')
  .attr('transform', `translate(${dims.width + 40}, 10)`);

const legend = d3.legendColor()
  .shape('circle')
  .shapePadding(10)
  .scale(color);

const tip = d3.tip()
  .attr('class', 'tip card')
  .html(d => {
    let content = `<div class="name">${d.data.name}</div>`;
    content += `<div class="cost">${d.data.cost}</div>`;
    content += `<div class="delete">Click slice to delete</div>`;
    return content;
  });

graph.call(tip);

// update function
const updateExpenses = data => {
  // update color scale domain
  color.domain(data.map(d => d.name));

  // update and call legend
  legendGroup.call(legend);
  legendGroup.selectAll('text').attr('fill', 'white');

  // join enhanced (pie) data to path elements
  const paths = graph.selectAll('path')
    .data(pie(data));

  // handle the exit selection
  paths.exit()
    .transition().duration(750)
    .attrTween('d', arcTweenExit)  
    .remove();

  // handle the current DOM path updates
  paths.attr('d', arcPath)
    .transition().duration(750)
    .attrTween('d', arcTweenUpdate);

  paths.enter()
    .append('path')
      .attr('class', 'arc')
      .attr('stroke', '#fff')
      .attr('stroke-width', 3)
      .attr('fill', d => color(d.data.name))
      .each(function(d) { this._current = d; })
      .transition().duration(750)
        .attrTween('d', arcTweenEnter);

  // add events
  graph.selectAll('path')
    .on('mouseover', (d, i, n) => {
      tip.show(d, n[i]);
      handleMouseOver(d, n, i);
    })
    .on('mouseout', (d, i, n) => {
      tip.hide();
      handleMouseOut(d, i, n);
    })
    .on('click', handleClick);
};

const arcTweenEnter = d => {
  const i = d3.interpolate(d.endAngle, d.startAngle);

  return function(t) {
    d.startAngle = i(t);
    return arcPath(d);
  }
};

const arcTweenExit = d => {
  const i = d3.interpolate(d.startAngle, d.endAngle);

  return function(t) {
    d.startAngle = i(t);
    return arcPath(d);
  }
};

// use function keyword
function arcTweenUpdate(d) {
  // interpolate between the two objects
  const i = d3.interpolate(this._current, d);
  // update the current prop with new updated data
  this._current = i(1);

  return function(t) {
    return arcPath(i(t));
  }
}

// event handlers
const handleMouseOver = (d, i, n) => {
  d3.select(n[i])
    .transition('changeSliceFill').duration(300)
      .attr('fill', '#fff');
}

const handleMouseOut = (d, i, n) => {
  d3.select(n[i])
    .transition('changeSliceFill').duration(300)
      .attr('fill', color(d.data.name));
}

const handleClick = (d) => {
  const id = d.data.id;
  db.collection('expenses').doc(id).delete();
}

// data array and firestore
let dataExpenses = [];

db.collection('expenses').onSnapshot(res => {
  res.docChanges().forEach(change => {
    const doc = { ...change.doc.data(), id: change.doc.id };
    
    switch (change.type) {
      case 'added':
        dataExpenses.push(doc);
        break;
      case 'modified':
        const index = dataExpenses.findIndex(item => item.id == doc.id);
        dataExpenses[index] = doc;
        break;
      case 'removed':
        dataExpenses = dataExpenses.filter(item => item.id !== doc.id);
        break;
      default:
        break;
    }
  });

  updateExpenses(dataExpenses);
});

// For activities script
const margin = { top: 40, right: 20, bottom: 50, left: 100 };
const graphWidth = 500 - margin.left - margin.right;
const graphHeight = 400 - margin.top - margin.bottom;

const svg1 = d3.select('.canvas-1')
  .append('svg')
  .attr('width', graphWidth + margin.left + margin.right)
  .attr('height', graphHeight + margin.top + margin.bottom);

const graph1 = svg1.append('g')
  .attr('width', graphWidth)
  .attr('height', graphHeight)
  .attr('transform', `translate(${margin.left}, ${margin.top})`);

const xx = d3.scaleTime().range([0, graphWidth]);
const yy = d3.scaleLinear().range([graphHeight, 0]);

const xAxisGroup1 = graph1.append('g')
  .attr('class', 'x-axis')
  .attr('transform', `translate(0, ${graphHeight})`);

const yAxisGroup1 = graph1.append('g')
  .attr('class', 'y-axis');

const line1 = d3.line()
  .x(d => xx(new Date(d.date)))
  .y(d => yy(d.distance));

const path1 = graph1.append('path');

const updateActivities = data => {
  data = data.filter(item => item.activity == activity);
  data.sort((a, b) => new Date(a.date) - new Date(b.date));

  xx.domain(d3.extent(data, d => new Date(d.date)));
  yy.domain([0, d3.max(data, d => d.distance)]);

  path1.data([data])
    .attr('fill', 'none')
    .attr('stroke', '#00bfa5')
    .attr('stroke-width', 2)
    .attr('d', line1);

  const circles = graph1.selectAll('circle')
    .data(data);

  circles.exit()
    .remove();

  circles
    .attr('cx', d => xx(new Date(d.date)))
    .attr('cy', d => yy(d.distance));

  circles.enter()
    .append('circle')
      .attr('r', 4)
      .attr('cx', d => xx(new Date(d.date)))
      .attr('cy', d => yy(d.distance))
      .attr('fill', '#ccc');

  graph1.selectAll('circle')
    .on('mouseover', (d, i, n) => {
      d3.select(n[i])
        .transition().duration(200)
          .attr('r', 8)
          .attr('fill', '#fff');
    })
    .on('mouseleave', (d, i, n) => {
      d3.select(n[i])
        .transition().duration(200)
          .attr('r', 4)
          .attr('fill', '#ccc');
    })

  const xAxis = d3.axisBottom(xx)
    .ticks(4)
    .tickFormat(d3.timeFormat('%b %d'));

  const yAxis = d3.axisLeft(yy)
    .ticks(4)
    .tickFormat(d => d + 'm');

  xAxisGroup1.call(xAxis);
  yAxisGroup1.call(yAxis);

  xAxisGroup1.selectAll('text')
    .attr('transform', 'rotate(-40)')
    .attr('text-anchor', 'end');
};

let dataActivities = [];

db.collection('activities').onSnapshot(res => {
  res.docChanges().forEach(change => {
    const doc = { ...change.doc.data(), id: change.doc.id };
    
    switch (change.type) {
      case 'added':
        dataActivities.push(doc);
        break;
      case 'modified':
        const index = dataActivities.findIndex(item => item.id == doc.id);
        dataActivities[index] = doc;
        break;
      case 'removed':
        dataActivities = dataActivities.filter(item => item.id !== doc.id);
        break;
      default:
        break;
    }
  });

  updateActivities(dataActivities);
});
