const { spawn } = require('child_process');
const path = require('path');

async function debugPythonScript() {
    console.log('=== Python Script Debug Test ===');
    
    const pythonScript = path.join(__dirname, 'python/modelService.py');
    const inputData = {
        "products": [{"product_name": "Tomato"}],
        "forecast_days": 5,
        "cities": ["Pune","Bangalore"]
    };
    
    const inputJson = JSON.stringify(inputData);
    
    console.log('Script path:', pythonScript);
    console.log('Input data:', inputJson);
    console.log('Starting process...');
    
    const startTime = Date.now();
    
    const pythonProcess = spawn('python', [pythonScript, 'predict_demand'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false
    });
    
    let outputData = '';
    let errorData = '';
    let dataReceived = false;
    
    // Write input data to stdin
    pythonProcess.stdin.write(inputJson);
    pythonProcess.stdin.end();
    
    pythonProcess.stdout.on('data', (data) => {
        const chunk = data.toString();
        outputData += chunk;
        dataReceived = true;
        console.log('STDOUT chunk received:', chunk.length, 'bytes');
        console.log('STDOUT content:', chunk.substring(0, 200) + (chunk.length > 200 ? '...' : ''));
    });
    
    pythonProcess.stderr.on('data', (data) => {
        const chunk = data.toString();
        errorData += chunk;
        console.log('STDERR:', chunk);
    });
    
    pythonProcess.on('close', (code) => {
        const endTime = Date.now();
        console.log('\n=== Process Completed ===');
        console.log('Exit code:', code);
        console.log('Duration:', endTime - startTime, 'ms');
        console.log('Data received:', dataReceived);
        console.log('Output length:', outputData.length);
        console.log('Error length:', errorData.length);
        
        if (outputData.length > 0) {
            console.log('\n=== OUTPUT ===');
            console.log(outputData);
        }
        
        if (errorData.length > 0) {
            console.log('\n=== ERRORS ===');
            console.log(errorData);
        }
        
        if (code === 0 && outputData.length > 0) {
            try {
                const lines = outputData.trim().split('\n');
                const lastLine = lines[lines.length - 1];
                const result = JSON.parse(lastLine);
                console.log('\n=== PARSED RESULT ===');
                console.log('Success:', result.success);
                console.log('Predictions count:', result.predictions ? result.predictions.length : 0);
            } catch (e) {
                console.log('\n=== PARSE ERROR ===');
                console.log(e.message);
            }
        }
    });
    
    pythonProcess.on('error', (error) => {
        console.error('Process error:', error);
    });
    
    // Set a timeout
    setTimeout(() => {
        console.log('\n=== TIMEOUT REACHED ===');
        console.log('Killing process...');
        pythonProcess.kill('SIGKILL');
    }, 10000); // 10 seconds for debug
}

debugPythonScript();
