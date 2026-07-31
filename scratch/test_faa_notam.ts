async function testFaaNotamFetch(icao: string) {
  console.log(`Testing FAA NOTAM Search API for ${icao}...`);
  try {
    const params = new URLSearchParams();
    params.append('searchType', '0');
    params.append('designatorsForLocation', icao.toUpperCase());

    const res = await fetch('https://notams.aim.faa.gov/notamSearch/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
      },
      body: params.toString(),
    });

    console.log(`Response Status: ${res.status} ${res.statusText}`);
    if (res.ok) {
      const data: any = await res.json();
      console.log(`notamList length: ${data.notamList?.length || 0}`);
      if (data.notamList && data.notamList.length > 0) {
        console.log('Sample NOTAM 1:', JSON.stringify(data.notamList[0], null, 2));
      }
    } else {
      const errText = await res.text();
      console.log('Error output:', errText.slice(0, 300));
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testFaaNotamFetch('KJFK');
testFaaNotamFetch('VIDP');
