precision highp float;
varying vec3 localPos;
varying vec2 vTexCoord;

// our texture
uniform sampler2D environmentMap;
uniform float roughness;

const float PI = 3.14159265359;

float VanDerCorput(int bits);
vec2 HammersleyNoBitOps(int i, int N);
vec3 ImportanceSampleGGX(vec2 Xi, vec3 N, float roughness);


vec2 nTOE( vec3 v ){
  // x = r sin(phi) cos(theta)   
  // y = r cos(phi)  
  // z = r sin(phi) sin(theta)
  float phi = acos( v.y );
  // if phi is 0, then there are no x, z components
  float theta = 0.0;
  // else 
  theta = acos(v.x / sin(phi));
  float sinTheta = v.z / sin(phi);
  if (sinTheta < 0.0) {
    // Turn it into -theta, but in the 0-2PI range
    theta = 2.0 * PI - theta;
  }
  theta = theta / (2.0 * 3.14159);
  phi = phi / 3.14159 ;
  
  vec2 angles = vec2( phi, theta );
  return angles;
}


void main(){
  const int SAMPLE_COUNT = 1024; // 4096
  float totalWeight = 0.0;
  vec3 prefilteredColor = vec3(0.0);
  float phi = vTexCoord.x * 2.0 * PI;
  float theta = vTexCoord.y * PI;
  float x = sin(theta) * cos(phi);
  float y = sin(theta) * sin(phi);
  float z = cos(theta);
  vec3 N = vec3(x,y,z);
  vec3 V = N;
  for (int i = 0; i < SAMPLE_COUNT; ++i)
  {
    vec2 Xi = HammersleyNoBitOps(i, SAMPLE_COUNT);
    vec3 H = ImportanceSampleGGX(Xi, N, roughness);
    vec3 L = normalize(2.0 * dot(V, H) * H - V);

    float NdotL = max(dot(N, L), 0.0);
    if (NdotL > 0.0)
    {
      prefilteredColor += texture2D(environmentMap, nTOE(L)).xyz * NdotL;
      totalWeight += NdotL;
    }
  }
  prefilteredColor = prefilteredColor / totalWeight;

  gl_FragColor = vec4(prefilteredColor, 1.0);
}

vec3 ImportanceSampleGGX(vec2 Xi, vec3 N, float roughness){
  float a = roughness * roughness;

  float phi = 2.0 * PI * Xi.x;
  float cosTheta = sqrt((1.0 - Xi.y) / (1.0 + (a * a - 1.0) * Xi.y));
  float sinTheta = sqrt(1.0 - cosTheta * cosTheta);
  // from spherical coordinates to cartesian coordinates
  vec3 H;
  H.x = cos(phi) * sinTheta;
  H.y = sin(phi) * sinTheta;
  H.z = cosTheta;

  // from tangent-space vector to world-space sample vector
  vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
  vec3 tangent = normalize(cross(up, N));
  vec3 bitangent = cross(N, tangent);

  vec3 sampleVec = tangent * H.x + bitangent * H.y + N * H.z;
  return normalize(sampleVec);
}


float VanDerCorput(int n, int base)
{
  float invBase = 1.0 / float(base);
  float denom = 1.0;
  float result = 0.0;

  for (int i = 0; i < 32; ++i)
  {
	if (n > 0)
	{
  	denom = mod(float(n), 2.0);
  	result += denom * invBase;
  	invBase = invBase / 2.0;
  	n = int(float(n) / 2.0);
	}
  }

  return result;
}

vec2 HammersleyNoBitOps(int i, int N)
{
  return vec2(float(i) / float(N), VanDerCorput(i, 2));
}
