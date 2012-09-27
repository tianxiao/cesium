/*global defineSuite*/
defineSuite([
         'Core/WebMercatorProjection',
         'Core/Cartesian2',
         'Core/Cartesian3',
         'Core/Cartographic',
         'Core/Ellipsoid',
         'Core/Math'
     ], function(
         WebMercatorProjection,
         Cartesian2,
         Cartesian3,
         Cartographic,
         Ellipsoid,
         CesiumMath) {
    "use strict";
    /*global jasmine,describe,xdescribe,it,xit,expect,beforeEach,afterEach,beforeAll,afterAll,spyOn,runs,waits,waitsFor*/

    it('construct0', function() {
        var projection = new WebMercatorProjection();
        expect(projection.getEllipsoid()).toEqual(Ellipsoid.WGS84);
    });

    it('construct1', function() {
        var ellipsoid = Ellipsoid.UNIT_SPHERE;
        var projection = new WebMercatorProjection(ellipsoid);
        expect(projection.getEllipsoid()).toEqual(ellipsoid);
    });

    it('project0', function() {
        var height = 10.0;
        var cartographic = new Cartographic(0.0, 0.0, height);
        var projection = new WebMercatorProjection();
        expect(projection.project(cartographic).equals(new Cartesian3(0.0, 0.0, height))).toEqual(true);
    });

    it('project1', function() {
        var ellipsoid = Ellipsoid.WGS84;
        var cartographic = new Cartographic(Math.PI, CesiumMath.PI_OVER_FOUR, 0.0);

        // expected equations from Wolfram MathWorld:
        // http://mathworld.wolfram.com/MercatorProjection.html
        var expected = new Cartesian3(
                ellipsoid.getMaximumRadius() * cartographic.longitude,
                ellipsoid.getMaximumRadius() * Math.log(Math.tan(Math.PI / 4.0 + cartographic.latitude / 2.0)),
                0.0);

        var projection = new WebMercatorProjection(ellipsoid);
        expect(projection.project(cartographic).equalsEpsilon(expected, CesiumMath.EPSILON8)).toEqual(true);
    });

    it('project2', function() {
        var ellipsoid = Ellipsoid.UNIT_SPHERE;
        var cartographic = new Cartographic(-Math.PI, CesiumMath.PI_OVER_FOUR, 0.0);

        // expected equations from Wolfram MathWorld:
        // http://mathworld.wolfram.com/MercatorProjection.html
        var expected = new Cartesian3(
                ellipsoid.getMaximumRadius() * cartographic.longitude,
                ellipsoid.getMaximumRadius() * Math.log(Math.tan(Math.PI / 4.0 + cartographic.latitude / 2.0)),
                0.0);

        var projection = new WebMercatorProjection(ellipsoid);
        expect(projection.project(cartographic).equalsEpsilon(expected, CesiumMath.EPSILON15)).toEqual(true);
    });

    it('unproject', function() {
        var cartographic = new Cartographic(CesiumMath.PI_OVER_TWO, CesiumMath.PI_OVER_FOUR, 12.0);
        var projection = new WebMercatorProjection();
        var projected = projection.project(cartographic);
        expect(projection.unproject(projected).equalsEpsilon(cartographic, CesiumMath.EPSILON14)).toEqual(true);
    });

    it('unproject is correct at corners', function() {
        var projection = new WebMercatorProjection();
        var southwest = projection.unproject(new Cartesian2(-20037508.342787, -20037508.342787));
        expect(southwest.longitude).toEqualEpsilon(-Math.PI, CesiumMath.EPSILON12);
        expect(southwest.latitude).toEqualEpsilon(CesiumMath.toRadians(-85.05112878), CesiumMath.EPSILON11);

        var southeast = projection.unproject(new Cartesian2(20037508.342787, -20037508.342787));
        expect(southeast.longitude).toEqualEpsilon(Math.PI, CesiumMath.EPSILON12);
        expect(southeast.latitude).toEqualEpsilon(CesiumMath.toRadians(-85.05112878), CesiumMath.EPSILON11);

        var northeast = projection.unproject(new Cartesian2(20037508.342787, 20037508.342787));
        expect(northeast.longitude).toEqualEpsilon(Math.PI, CesiumMath.EPSILON12);
        expect(northeast.latitude).toEqualEpsilon(CesiumMath.toRadians(85.05112878), CesiumMath.EPSILON11);

        var northwest = projection.unproject(new Cartesian2(-20037508.342787, 20037508.342787));
        expect(northwest.longitude).toEqualEpsilon(-Math.PI, CesiumMath.EPSILON12);
        expect(northwest.latitude).toEqualEpsilon(CesiumMath.toRadians(85.05112878), CesiumMath.EPSILON11);
    });

    it('project is correct at corners.', function() {
        var maxLatitude = WebMercatorProjection.MaximumLatitude;

        var projection = new WebMercatorProjection();

        var southwest = projection.project(new Cartographic(-Math.PI, -maxLatitude));
        expect(southwest.x).toEqualEpsilon(-20037508.342787, CesiumMath.EPSILON3);
        expect(southwest.y).toEqualEpsilon(-20037508.342787, CesiumMath.EPSILON3);

        var southeast = projection.project(new Cartographic(Math.PI, -maxLatitude));
        expect(southeast.x).toEqualEpsilon(20037508.342787, CesiumMath.EPSILON3);
        expect(southeast.y).toEqualEpsilon(-20037508.342787, CesiumMath.EPSILON3);

        var northeast = projection.project(new Cartographic(Math.PI, maxLatitude));
        expect(northeast.x).toEqualEpsilon(20037508.342787, CesiumMath.EPSILON3);
        expect(northeast.y).toEqualEpsilon(20037508.342787, CesiumMath.EPSILON3);

        var northwest = projection.project(new Cartographic(-Math.PI, maxLatitude));
        expect(northwest.x).toEqualEpsilon(-20037508.342787, CesiumMath.EPSILON3);
        expect(northwest.y).toEqualEpsilon(20037508.342787, CesiumMath.EPSILON3);
    });

    it('projected y is clamped to valid latitude range.', function() {
        var projection = new WebMercatorProjection();
        var southPole = projection.project(new Cartographic(0.0, -CesiumMath.PI_OVER_TWO));
        var southLimit = projection.project(new Cartographic(0.0, -WebMercatorProjection.MaximumLatitude));
        expect(southPole.y).toEqual(southLimit.y);

        var northPole = projection.project(new Cartographic(0.0, CesiumMath.PI_OVER_TWO));
        var northLimit = projection.project(new Cartographic(0.0, WebMercatorProjection.MaximumLatitude));
        expect(northPole.y).toEqual(northLimit.y);
    });
});