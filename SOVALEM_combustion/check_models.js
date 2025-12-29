const key = 'AIzaSyDAZmUnIB9IvFcuqu1Bam4tVXlIj8HxI1k';
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

fetch(url)
    .then(res => res.json())
    .then(data => {
        console.log('Available Models:');
        if (data.models) {
            data.models.forEach(m => console.log(`- ${m.name} (${m.supportedGenerationMethods})`));
        } else {
            console.log('No models found or error:', JSON.stringify(data));
        }
    })
    .catch(err => console.error('Fetch error:', err));
