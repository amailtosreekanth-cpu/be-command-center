window.BEGlobe = (function() {
  let globeInstance = null;
  const HOTSPOTS = [
    { lat: 10.0,  lng: 76.2,  size: 1.0, color: '#FF005D', label: 'Kochi HQ' },
    { lat: 10.85, lng: 76.55, size: 0.7, color: '#00FF88', label: 'Edappal' },
    { lat: 12.97, lng: 77.59, size: 0.5, color: '#00B8FF', label: 'Bangalore' },
    { lat: 28.6,  lng: 77.2,  size: 0.4, color: '#B95CFF', label: 'Delhi' },
  ];

  function init(elementId) {
    const el = document.getElementById(elementId);
    if (!el || !window.Globe) return;
    fetch('https://raw.githubusercontent.com/deldersveld/topojson/master/countries/india/india-states.json')
      .then(r => r.json())
      .then(topo => {
        let features = [];
        try {
          features = window.topojson.feature(topo, topo.objects[Object.keys(topo.objects)[0]]).features;
        } catch (e) {}
        build(el, features);
      })
      .catch(() => build(el, []));
  }

  function build(el, indiaFeatures) {
    globeInstance = Globe()(el)
      .backgroundColor('rgba(0,0,0,0)')
      .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-night.jpg')
      .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
      .showAtmosphere(true)
      .atmosphereColor('#FF005D')
      .atmosphereAltitude(0.22)
      .width(295)
      .height(295)
      .polygonsData(indiaFeatures)
      .polygonCapColor(() => 'rgba(255,0,93,0.15)')
      .polygonSideColor(() => 'rgba(255,0,93,0.05)')
      .polygonStrokeColor(() => '#FF005D')
      .polygonAltitude(0.01)
      .pointsData(HOTSPOTS)
      .pointLat('lat').pointLng('lng').pointColor('color')
      .pointAltitude(0.02).pointRadius(d => d.size * 0.35).pointsMerge(false)
      .ringsData(HOTSPOTS)
      .ringLat('lat').ringLng('lng')
      .ringColor(d => () => d.color)
      .ringMaxRadius(d => d.size * 4)
      .ringPropagationSpeed(2)
      .ringRepeatPeriod(1400);

    globeInstance.controls().autoRotate = true;
    globeInstance.controls().autoRotateSpeed = 0.6;
    globeInstance.controls().enableZoom = false;
    globeInstance.pointOfView({ lat: 15, lng: 78, altitude: 2.1 });
  }

  function destroy() { if (globeInstance && globeInstance._destructor) globeInstance._destructor(); }
  return { init, destroy };
})();
