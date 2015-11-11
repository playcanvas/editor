var jobs = { };

onmessage = function(evt) {
    if (! evt.data.name)
        return;

    switch(evt.data.name) {
        case 'start':
            abort(evt.data.id);
            start(evt.data.id, evt.data.filename);
            break;
        case 'abort':
            abort(evt.data.id);
            break;
    };
};

var start = function(id, filename) {
    var job = jobs[id] = { };

    job.xhr = new XMLHttpRequest();

    job.xhr.addEventListener('load', function() {
        try {
            var data = JSON.parse(this.responseText);

            var unwrap = new Unwrap();
            unwrap.unwrapJsonModel(data, true);

            postMessage({
                name: 'finish',
                id: id,
                data: data
            });
            delete job[id];
        } catch(e) {
            postMessage({
                name: 'error',
                id: id,
                err: e.message,
                stack: e.stack.split('\n')
            });
            abort(id);
        }
    });
    job.xhr.addEventListener('error', function() {
        postMessage({
            name: 'error',
            id: id,
            err: 'error loading json'
        });
        abort(id);
    });

    job.xhr.open('GET', '/api/files/assets/' + id + '/1/' + filename, true);
    job.xhr.send(null);

    postMessage('started ' + id);
};

var abort = function(id) {
    if (! jobs[id])
        return;

    delete jobs[id];
};

var Unwrap=function(){this.resolution=1024;this.padding=2;this.paddingUv=this.padding/this.resolution};
Unwrap.prototype={swap:function(a,b,c){var d=a[b];a[b]=a[c];a[c]=d},crossNormalize:function(a,b){var c=a.y*b.z-a.z*b.y,d=a.z*b.x-a.x*b.z,h=a.x*b.y-a.y*b.x,k=Math.sqrt(c*c+d*d+h*h);return{x:c/k,y:d/k,z:h/k}},triNormal:function(a,b,c,d,h,k,f,e,g){a-=d;b-=h;c-=k;d-=f;h-=e;g=k-g;k=b*g-c*h;g=c*d-a*g;a=a*h-b*d;b=Math.sqrt(k*k+g*g+a*a);return{x:k/b,y:g/b,z:a/b}},cubeFaceFromNormal:function(a){var b=Math.abs(a.x),c=Math.abs(a.y),d=Math.abs(a.z);return b>c&&b>d?0>a.x?0:1:c>b&&c>d?0>a.y?2:3:0>a.z?4:5},boxUnwrap:function(a,
b){Date.now();var c=b.length/3,d,h,k,f,e,g,m,r,u,t=0,l;d=0;var p=[];for(l=0;6>l;l++)p[l]=[];for(l=0;l<a.length;l+=3)d=b[3*a[l]],h=b[3*a[l]+1],k=b[3*a[l]+2],f=b[3*a[l+1]],e=b[3*a[l+1]+1],g=b[3*a[l+1]+2],m=b[3*a[l+2]],r=b[3*a[l+2]+1],u=b[3*a[l+2]+2],d=this.triNormal(d,h,k,f,e,g,m,r,u),d=this.cubeFaceFromNormal(d),p[d].push(a[l]),p[d].push(a[l+1]),p[d].push(a[l+2]);for(l=1;6>l;l++);h=[];e=[];for(f=0;6>f;f++)for(d=f+1;6>d;d++)for(l=0;l<p[f].length;l++){h=[];for(j=0;j<p[d].length;j++)p[f][l]===p[d][j]&&
h.push(j);if(0<h.length){for(j=0;j<h.length;j++)p[d][h[j]]=c;e.push(p[f][l]);c++;t++}}for(l=0;l<t;l++)b.push(b[3*e[l]]),b.push(b[3*e[l]+1]),b.push(b[3*e[l]+2]);c=[];t=[{x:-1,y:0,z:0},{x:1,y:0,z:0},{x:0,y:-1,z:0},{x:0,y:1,z:0},{x:0,y:0,z:-1},{x:0,y:0,z:1}];for(f=offset=0;6>f;f++)for(l=t[f],g=this.crossNormalize(l,.5<Math.abs(l.y)?{x:1,y:0,z:0}:{x:0,y:1,z:0}),m=this.crossNormalize(l,g),g=this.crossNormalize(l,m),l=0;l<p[f].length;l++)a[offset]=p[f][l],d=b[3*a[offset]],h=b[3*a[offset]+1],k=b[3*a[offset]+
2],c[2*a[offset]]=g.x*d+g.y*h+g.z*k,c[2*a[offset]+1]=m.x*d+m.y*h+m.z*k,offset++;return{append:e,uv:c}},findCharts:function(a){Date.now();var b,c,d,h=[],k=0,f;for(b=0;b<a.length;b++){c=3*Math.floor(b/3);k=Math.max(c+3,k);0===b%3&&(f=3);for(j=k;j<a.length;j++)a[b]===a[j]&&(d=3*Math.floor(j/3),this.swap(a,k,d),this.swap(a,k+1,d+1),this.swap(a,k+2,d+2),j=d+2,k+=3,f--);2===b%3&&3>f&&(0<h.length&&h[h.length-1]>c?h[h.length-1]=k:h.push(k))}for(b=a=0;b<h.length;b++)h[b]=(h[b]-3*a)/3,a+=h[b];return h},triangleArea:function(a,
b,c,d,h,k,f,e,g){d-=a;h-=b;k-=c;f-=a;e-=b;g-=c;a=h*g-k*e;k=k*f-d*g;d=d*e-h*f;return.5*Math.sqrt(a*a+k*k+d*d)},calculateChartArea:function(a,b,c,d){var h,k,f,e,g,m,r,u,t,l,p,q,n,x,v,w=0,y,B,D=[],E=[],H=0,I=0,z,A,C,F,G=[];for(h=0;h<b.length;h++){f=b[h];B=y=0;z=A=99999;C=F=-99999;for(k=0;k<f;k++)e=w+k,g=a[3*e],m=a[3*e+1],e=a[3*e+2],r=c[3*g],u=c[3*g+1],t=c[3*g+2],l=c[3*m],p=c[3*m+1],q=c[3*m+2],n=c[3*e],x=c[3*e+1],v=c[3*e+2],y+=this.triangleArea(r,u,t,l,p,q,n,x,v),r=d[2*g],g=d[2*g+1],u=d[2*m],m=d[2*m+
1],t=d[2*e],e=d[2*e+1],B+=this.triangleArea(r,g,0,u,m,0,t,e,0),z=Math.min(z,r),z=Math.min(z,u),z=Math.min(z,t),A=Math.min(A,g),A=Math.min(A,m),A=Math.min(A,e),C=Math.max(C,r),C=Math.max(C,u),C=Math.max(C,t),F=Math.max(F,g),F=Math.max(F,m),F=Math.max(F,e);0===y&&(console.warn("Zero area"),B=y=.01,C=z+.01,F=A+.01);isNaN(y)&&(console.warn("NaN area"),B=y=.01,C=z+.01,F=A+.01);H+=y;I+=B;D.push(y);E.push(B);w+=f;G[h]={x:0,y:0,z:0,w:0};G[h].x=z;G[h].y=A;G[h].z=C-G[h].x;G[h].w=F-G[h].y}return{areas:D,areasT:E,
totalArea:H,totalAreaT:I,aabbs:G}},normalizeCharts:function(a,b,c,d,h,k){a=c.areas;d=c.areasT;k=c.totalArea;var f=[];for(c=0;c<b.length;c++)h=.8*Math.sqrt(1/d[c]*(a[c]/k)),f.push(h);return f},fits:function(a,b){return a.z<=b.z&&a.w<=b.w},fitsExactly:function(a,b){return a.z===b.z&&a.w===b.w},findHoles:function(a,b,c,d,h,k,f,e){var g;c=Math.floor((a.aabb.z*this.resolution-2*this.padding)/4);var m=Math.floor((a.aabb.w*this.resolution-2*this.padding)/4);if(0>=c||0>=m)return[];var r=new Uint8Array(c*
m),u=0;for(g=0;g<h.length&&g!==b;g++)u+=h[g];var t=h[b],l=f[b].x*e,p=f[b].y*e,q=f[b].z*e,n=f[b].w*e,x,v,w;for(g=0;g<t;g++){h=k[3*(u+g)];f=k[3*(u+g)+1];b=k[3*(u+g)+2];x=d[2*h]*e;v=d[2*h+1]*e;var y=d[2*f]*e,B=d[2*f+1]*e,D=d[2*b]*e,E=d[2*b+1]*e;x=(x-l)/q;y=(y-l)/q;D=(D-l)/q;v=(v-p)/n;B=(B-p)/n;E=(E-p)/n;f=b=99999;w=h=-99999;b=Math.min(b,x);b=Math.min(b,y);b=Math.min(b,D);f=Math.min(f,v);f=Math.min(f,B);f=Math.min(f,E);h=Math.max(h,x);h=Math.max(h,y);h=Math.max(h,D);w=Math.max(w,v);w=Math.max(w,B);w=
Math.max(w,E);b*=c;h*=c;f*=m;w*=m;b=Math.floor(b)-this.padding;f=Math.floor(f)-this.padding;h=Math.floor(h)+this.padding;w=Math.floor(w)+this.padding;for(v=f;v<=w;v++)for(x=b;x<=h;x++)r[v*c+x]=255}b=Math.max(c,m);d=[r];g=c;h=m;k=[g];e=[h];for(f=0;8<b;){t=Math.floor(g/2);l=Math.floor(h/2);u=new Uint8Array(t*l);for(v=0;v<l;v++)for(x=0;x<t;x++){for(n=b=0;2>n;n++)for(q=0;2>q;q++)b=Math.max(b,d[f][(2*v+n)*g+(2*x+q)]);u[v*t+x]=b}b=Math.max(t,l);g=t;h=l;f++;d[f]=u;k[f]=t;e[f]=l}p=[];for(g=d.length-1;0<=
g;g--)for(t=k[g],l=e[g],u=d[g],y=c/t,B=m/l,v=0;v<l;v++)for(x=0;x<t;x++)if(0===u[v*t+x]){f=Math.floor(x*y);w=Math.floor(v*B);h=b=f;f=w;for(var D=b,E=f,H=h,I=w,z=!0,A=0,C=!0;z;){if(0>b||0>f||h>c-1||w>m-1)z=!1;else for(n=f;n<=w;n++){for(q=b;q<=h;q++)if(0<r[n*c+q]){z=!1;break}if(!z)break}if(z)for(q=0;q<p.length;q++)if(!(p[q].maxx<b||p[q].minx>h||p[q].maxy<f||p[q].miny>w)){z=!1;break}if(!z){if(C)break;b=D;f=E;h=H;w=I;A++;if(6>A)z=!0;else break}C=!1;D=b;E=f;H=h;I=w;0===A?(f--,b--):1===A?(w++,h++):2===A?
b--:3===A?f--:4===A?h++:5===A&&w++}C||p.push({minx:b,miny:f,maxx:h,maxy:w})}for(g=0;g<p.length;g++)r={x:0,y:0,z:0,w:0},r.x=p[g].minx/c*a.aabb.z+a.aabb.x,r.y=p[g].miny/m*a.aabb.w+a.aabb.y,r.z=(p[g].maxx-p[g].minx)/c*a.aabb.z,r.w=(p[g].maxy-p[g].miny)/m*a.aabb.w,p[g]={aabb:r,id:-1,child:[],leaf:!0};return p},insertToAtlas:function(a,b,c,d,h,k,f,e){if(a.leaf){if(0<=a.id||!this.fits(c,a.aabb))return null;if(this.fitsExactly(c,a.aabb))return a.id=b,b=this.findHoles(a,b,c,d,h,k,f,e),0<b.length&&(a.leaf=
!1,a.child=b,a.insideHole=!0),a;var g={x:0,y:0,z:0,w:0},m={x:0,y:0,z:0,w:0};a.aabb.z-c.z>a.aabb.w-c.w?(g.x=a.aabb.x,g.y=a.aabb.y,g.z=c.z,g.w=a.aabb.w,m.x=a.aabb.x+c.z,m.y=a.aabb.y,m.z=a.aabb.z-c.z,m.w=a.aabb.w):(g.x=a.aabb.x,g.y=a.aabb.y,g.z=a.aabb.z,g.w=c.w,m.x=a.aabb.x,m.y=a.aabb.y+c.w,m.z=a.aabb.z,m.w=a.aabb.w-c.w);a.leaf=!1;a.child=[];a.child[0]={aabb:g,id:-1,child:[],leaf:!0,test:!1};a.child[1]={aabb:m,id:-1,child:[],leaf:!0,test:!1};return this.insertToAtlas(a.child[0],b,c,d,h,k,f,e)}for(g=
0;g<a.child.length;g++)if(m=this.insertToAtlas(a.child[g],b,c,d,h,k,f,e))return m;return null},transformUv:function(a,b){a.x=a.x*b.x+b.z;a.y=a.y*b.y+b.w},packCharts:function(a,b,c,d,h,k,f){Date.now();var e,g={aabb:{x:0,y:0,z:1,w:1},id:-1,child:[],leaf:!0,test:!1},m=[],r=[];for(e=0;e<b.length;e++)r[e]=e;r.sort(function(a,b){return Math.max(c[b].z*k[b],c[b].w*k[b])-Math.max(c[a].z*k[a],c[a].w*k[a])});for(var u=0,t=0,l=0,p=0,q=99999,n,x=0;x<c.length;x++){e=r[x];n={x:c[e].x,y:c[e].y,z:c[e].z,w:c[e].w};
n.x=n.x*k[e]*f;n.y=n.y*k[e]*f;n.z=n.z*k[e]*f;n.w=n.w*k[e]*f;n.z+=2*this.paddingUv;n.w+=2*this.paddingUv;var v=this.insertToAtlas(g,e,n,h,b,a,c,k[e]*f);v?(m[e]=v.aabb,v.insideHole||(t+=m[e].z*m[e].w)):u+=n.z*n.w;l=Math.max(l,n.z);p=Math.max(p,n.w);q=Math.min(q,n.z)}d.usedArea=t;d.maxWidth=l;d.maxHeight=p;d.minWidth=q;if(0<u)return d.notFitted=u,!1;for(e=0;e<m.length;e++)m[e].z>2*this.paddingUv&&m[e].w>2*this.paddingUv&&(m[e].x+=this.paddingUv,m[e].y+=this.paddingUv,m[e].z-=2*this.paddingUv,m[e].w-=
2*this.paddingUv);a=[];for(e=0;e<c.length;e++)n={x:c[e].x,y:c[e].y,z:c[e].z,w:c[e].w},n.x=n.x*k[e]*f,n.y=n.y*k[e]*f,n.z=n.z*k[e]*f,n.w=n.w*k[e]*f,b=m[e].z/n.z,d=m[e].w/n.w,a.push({x:b,y:d,z:m[e].x-n.x*b,w:m[e].y-n.y*d});return a},transformUv2:function(a,b,c,d){a.x=a.x*b*c;a.y=a.y*b*c;return this.transformUv(a,d)},finalTransformUv:function(a,b,c,d,h,k){var f,e,g,m,r,u={x:0,y:0},t={x:0,y:0},l={x:0,y:0},p=0,q=[];for(f=0;f<b.length;f++){chartTris=b[f];for(e=0;e<chartTris;e++)g=p+e,m=a[3*g],r=a[3*g+1],
g=a[3*g+2],u.x=c[2*m],u.y=c[2*m+1],t.x=c[2*r],t.y=c[2*r+1],l.x=c[2*g],l.y=c[2*g+1],q[m]||this.transformUv2(u,d[f],h,k[f]),q[r]||this.transformUv2(t,d[f],h,k[f]),q[g]||this.transformUv2(l,d[f],h,k[f]),c[2*m]=u.x,c[2*m+1]=u.y,c[2*r]=t.x,c[2*r+1]=t.y,c[2*g]=l.x,c[2*g+1]=l.y,q[m]=!0,q[r]=!0,q[g]=!0;p+=chartTris}},unwrapJsonModel:function(a,b){var c,d,h,k,f,e,g;k=[];var m=[],r=[],u=[],t=[],l=0,p,q,n=.025;for(c=0;c<a.model.meshInstances.length;c++){e=a.model.meshInstances[c].mesh;d=a.model.meshInstances[c].node;
f=a.model.meshes[e].indices;q=a.model.vertices[e];e=q.position.data;g=q.texCoord0?q.texCoord0.data:null;p=a.model.nodes[d].scale;b&&(g=null);d={uv:g,append:[]};g||(d=this.boxUnwrap(f,e),g=d.uv);var x=d.append,v;for(v in q)if("position"!==v&&q.hasOwnProperty(v)){var w=q[v].data,y=q[v].components;for(h=0;h<x.length;h++)for(d=0;d<y;d++)w.push(w[x[h]*y+d])}t[c]=e.length/3;for(d=0;d<f.length;d++)k.push(f[d]+l);for(d=0;d<e.length/3;d++)m.push(e[3*d]*p[0]),m.push(e[3*d+1]*p[1]),m.push(e[3*d+2]*p[2]);for(d=
0;d<g.length;d++)r.push(g[d]);u[c]=l;l+=e.length/3}c=this.findCharts(k);g=this.calculateChartArea(k,c,m,r);m=this.normalizeCharts(k,c,g,r);for(f=1;;){l=this.packCharts(k,c,g.aabbs,g,r,m,f);if(!l)break;f+=n;if(100<f){console.error("Failed to unwrap");return}}for(n=-.025;;){f+=n;if(0>f){if(1>this.padding){console.error("Failed to unwrap");return}this.padding*=.5;this.paddingUv*=.5;f=1;console.warn("Reducing padding to "+this.padding)}if(l=this.packCharts(k,c,g.aabbs,g,r,m,f))break}this.finalTransformUv(k,
c,r,m,f,l);for(c=0;c<a.model.meshInstances.length;c++){k=a.model.meshInstances[c];g=[];for(d=0;d<2*t[c];d++)g.push(r[2*u[c]+d]);e=k.mesh;q=a.model.vertices[e];q.texCoord1={data:g,components:2,type:"float32"}}}};
