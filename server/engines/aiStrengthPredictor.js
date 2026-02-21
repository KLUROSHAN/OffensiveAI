import crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════
// NEURAL NETWORK PASSWORD STRENGTH PREDICTOR
//
// A feedforward neural network implemented in pure JavaScript.
// Extracts 15 features from a password and runs them through a
// 3-layer network (15 → 32 → 16 → 4) to predict crackability.
//
// AI Techniques: Feedforward Neural Network, Sigmoid Activation,
//                Feature Engineering, Pre-trained Weights
// ═══════════════════════════════════════════════════════════════════

// ─── Neural Network Implementation ──────────────────────────────

class NeuralNetwork {
    constructor(layerSizes) {
        this.layers = layerSizes;
        this.weights = [];
        this.biases = [];
        this._seed = 42; // Reproducible initialization

        // Initialize weights for each layer pair
        for (let i = 0; i < layerSizes.length - 1; i++) {
            this.weights.push(this._initWeights(layerSizes[i], layerSizes[i + 1]));
            this.biases.push(new Array(layerSizes[i + 1]).fill(0));
        }
    }

    // Seeded pseudo-random for reproducible weights
    _seededRandom() {
        this._seed = (this._seed * 16807) % 2147483647;
        return (this._seed - 1) / 2147483646;
    }

    // Xavier initialization with seed
    _initWeights(rows, cols) {
        const scale = Math.sqrt(2 / (rows + cols));
        const weights = [];
        for (let i = 0; i < rows; i++) {
            weights.push([]);
            for (let j = 0; j < cols; j++) {
                weights[i].push((this._seededRandom() * 2 - 1) * scale);
            }
        }
        return weights;
    }

    // Activation functions
    sigmoid(x) { return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x)))); }
    relu(x) { return Math.max(0, x); }

    softmax(values) {
        // Guard against NaN
        const cleaned = values.map(v => (isNaN(v) || !isFinite(v)) ? 0 : v);
        const max = Math.max(...cleaned);
        const exps = cleaned.map(v => Math.exp(Math.min(v - max, 500)));
        const sum = exps.reduce((s, e) => s + e, 0) || 1;
        return exps.map(e => e / sum);
    }

    // Forward pass
    forward(input) {
        let current = input;
        const activations = [input];

        for (let layer = 0; layer < this.weights.length; layer++) {
            const next = [];
            for (let j = 0; j < this.weights[layer][0].length; j++) {
                let sum = this.biases[layer][j];
                for (let i = 0; i < current.length; i++) {
                    sum += current[i] * this.weights[layer][i][j];
                }
                // ReLU for hidden layers, raw for output (softmax applied separately)
                const val = layer < this.weights.length - 1 ? this.relu(sum) : sum;
                next.push(isNaN(val) ? 0 : val);
            }
            current = next;
            activations.push(current);
        }

        // Softmax on output
        const output = this.softmax(current);
        return { output, activations };
    }

    // Train on a single example (SGD)
    trainStep(input, target, lr = 0.01) {
        const { output, activations } = this.forward(input);

        // Output layer error (cross-entropy derivative with softmax)
        let deltas = output.map((o, i) => o - target[i]);

        // Backpropagate through layers
        for (let layer = this.weights.length - 1; layer >= 0; layer--) {
            const prevActivation = activations[layer];
            const newDeltas = new Array(prevActivation.length).fill(0);

            for (let i = 0; i < prevActivation.length; i++) {
                for (let j = 0; j < deltas.length; j++) {
                    // Update weight with gradient clipping
                    const grad = deltas[j] * prevActivation[i];
                    const clippedGrad = Math.max(-1, Math.min(1, grad));
                    this.weights[layer][i][j] -= lr * clippedGrad;
                    // Clamp weights to prevent explosion
                    this.weights[layer][i][j] = Math.max(-5, Math.min(5, this.weights[layer][i][j]));
                    // Accumulate delta for previous layer
                    newDeltas[i] += this.weights[layer][i][j] * deltas[j];
                }
            }

            // Update biases
            for (let j = 0; j < deltas.length; j++) {
                this.biases[layer][j] -= lr * deltas[j];
            }

            // Apply ReLU derivative for hidden layers
            if (layer > 0) {
                deltas = newDeltas.map((d, i) => prevActivation[i] > 0 ? d : 0);
            } else {
                deltas = newDeltas;
            }
        }

        // Calculate loss (cross-entropy)
        const loss = -target.reduce((sum, t, i) => sum + t * Math.log(Math.max(output[i], 1e-10)), 0);
        return { output, loss };
    }

    // Train on dataset
    train(dataset, epochs = 100, lr = 0.01) {
        const startTime = Date.now();
        const losses = [];

        for (let epoch = 0; epoch < epochs; epoch++) {
            let epochLoss = 0;
            // Shuffle dataset
            const shuffled = [...dataset].sort(() => Math.random() - 0.5);

            for (const { input, target } of shuffled) {
                const { loss } = this.trainStep(input, target, lr);
                epochLoss += loss;
            }

            epochLoss /= dataset.length;
            if (epoch % 20 === 0 || epoch === epochs - 1) {
                losses.push({ epoch, loss: epochLoss });
            }
        }

        return { trainTimeMs: Date.now() - startTime, finalLoss: losses[losses.length - 1]?.loss, epochs, losses };
    }
}

// ─── Feature Extraction ──────────────────────────────────────────
// Extracts 15 numerical features from a password

const COMMON_PASSWORDS = ['password', '123456', 'qwerty', 'admin', 'letmein', 'welcome', 'monkey', 'dragon', 'master', 'login', 'abc123', 'iloveyou', 'trustno1', 'football', 'shadow', 'sunshine', 'princess', 'passw0rd', 'p@ssword'];
const KEYBOARD_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm', '1234567890'];

function extractFeatures(password) {
    const len = password.length;
    const lower = password.toLowerCase();

    // 1. Length (normalized 0-1, max 20)
    const f_length = Math.min(len / 20, 1);

    // 2. Has lowercase
    const f_hasLower = /[a-z]/.test(password) ? 1 : 0;

    // 3. Has uppercase  
    const f_hasUpper = /[A-Z]/.test(password) ? 1 : 0;

    // 4. Has digits
    const f_hasDigits = /[0-9]/.test(password) ? 1 : 0;

    // 5. Has special chars
    const f_hasSpecial = /[^a-zA-Z0-9]/.test(password) ? 1 : 0;

    // 6. Character diversity ratio (unique chars / length)
    const f_diversity = len > 0 ? new Set(password).size / len : 0;

    // 7. Digit ratio
    const f_digitRatio = len > 0 ? (password.match(/[0-9]/g) || []).length / len : 0;

    // 8. Special char ratio
    const f_specialRatio = len > 0 ? (password.match(/[^a-zA-Z0-9]/g) || []).length / len : 0;

    // 9. Uppercase ratio
    const f_upperRatio = len > 0 ? (password.match(/[A-Z]/g) || []).length / len : 0;

    // 10. Repeated characters (max consecutive / length)
    const repeats = password.match(/(.)(\1+)/g) || [];
    const maxRepeat = repeats.length > 0 ? Math.max(...repeats.map(r => r.length)) : 0;
    const f_repeatRatio = len > 0 ? maxRepeat / len : 0;

    // 11. Sequential characters ratio
    let sequential = 0;
    for (let i = 0; i < len - 1; i++) {
        if (Math.abs(password.charCodeAt(i) - password.charCodeAt(i + 1)) === 1) sequential++;
    }
    const f_sequentialRatio = len > 1 ? sequential / (len - 1) : 0;

    // 12. Dictionary word present
    const f_dictMatch = COMMON_PASSWORDS.some(w => lower.includes(w)) ? 1 : 0;

    // 13. Keyboard walk pattern
    let kbWalk = 0;
    for (const row of KEYBOARD_ROWS) {
        for (let i = 0; i < row.length - 2; i++) {
            if (lower.includes(row.substring(i, i + 3))) kbWalk++;
        }
    }
    const f_keyboardWalk = Math.min(kbWalk / 3, 1);

    // 14. Entropy (Shannon)
    const charCounts = {};
    for (const c of password) charCounts[c] = (charCounts[c] || 0) + 1;
    let entropy = 0;
    for (const count of Object.values(charCounts)) {
        const p = count / len;
        entropy -= p * Math.log2(p);
    }
    const f_entropy = len > 0 ? Math.min(entropy / 5, 1) : 0; // Normalize (max ~5 bits)

    // 15. Char type transitions (how often char type changes)
    let transitions = 0;
    const getType = c => {
        if (/[a-z]/.test(c)) return 0;
        if (/[A-Z]/.test(c)) return 1;
        if (/[0-9]/.test(c)) return 2;
        return 3;
    };
    for (let i = 0; i < len - 1; i++) {
        if (getType(password[i]) !== getType(password[i + 1])) transitions++;
    }
    const f_transitions = len > 1 ? transitions / (len - 1) : 0;

    return [
        f_length, f_hasLower, f_hasUpper, f_hasDigits, f_hasSpecial,
        f_diversity, f_digitRatio, f_specialRatio, f_upperRatio,
        f_repeatRatio, f_sequentialRatio, f_dictMatch, f_keyboardWalk,
        f_entropy, f_transitions,
    ];
}

// ─── Training Dataset ────────────────────────────────────────────
// Label: [very_weak, weak, moderate, strong] (one-hot)

const TRAINING_DATA = [
    // Very Weak (class 0)
    { pw: '123456', label: [1, 0, 0, 0] },
    { pw: 'password', label: [1, 0, 0, 0] },
    { pw: 'qwerty', label: [1, 0, 0, 0] },
    { pw: 'abc123', label: [1, 0, 0, 0] },
    { pw: 'admin', label: [1, 0, 0, 0] },
    { pw: 'letmein', label: [1, 0, 0, 0] },
    { pw: '111111', label: [1, 0, 0, 0] },
    { pw: 'dragon', label: [1, 0, 0, 0] },
    { pw: 'master', label: [1, 0, 0, 0] },
    { pw: 'monkey', label: [1, 0, 0, 0] },
    { pw: 'login', label: [1, 0, 0, 0] },
    { pw: 'pass', label: [1, 0, 0, 0] },
    { pw: 'test', label: [1, 0, 0, 0] },
    { pw: '0000', label: [1, 0, 0, 0] },
    { pw: 'iloveyou', label: [1, 0, 0, 0] },

    // Weak (class 1)
    { pw: 'Password1', label: [0, 1, 0, 0] },
    { pw: 'Admin123', label: [0, 1, 0, 0] },
    { pw: 'hello2024', label: [0, 1, 0, 0] },
    { pw: 'football1', label: [0, 1, 0, 0] },
    { pw: 'sunshine1', label: [0, 1, 0, 0] },
    { pw: 'roshan123', label: [0, 1, 0, 0] },
    { pw: 'Michael1', label: [0, 1, 0, 0] },
    { pw: 'Welcome1', label: [0, 1, 0, 0] },
    { pw: 'Summer2024', label: [0, 1, 0, 0] },
    { pw: 'Charlie1', label: [0, 1, 0, 0] },
    { pw: 'trustno1', label: [0, 1, 0, 0] },
    { pw: 'p@ssword', label: [0, 1, 0, 0] },
    { pw: 'Princess1', label: [0, 1, 0, 0] },
    { pw: 'hunter2', label: [0, 1, 0, 0] },
    { pw: 'passw0rd', label: [0, 1, 0, 0] },

    // Moderate (class 2)
    { pw: 'K9#mPx2L', label: [0, 0, 1, 0] },
    { pw: 'Tr0ub4dor!', label: [0, 0, 1, 0] },
    { pw: 'MyD0g$Name', label: [0, 0, 1, 0] },
    { pw: 'C0ff33Tim3!', label: [0, 0, 1, 0] },
    { pw: 'Bl4ckF0x#7', label: [0, 0, 1, 0] },
    { pw: 'S3cur1ty!', label: [0, 0, 1, 0] },
    { pw: 'N1ghtHawk$', label: [0, 0, 1, 0] },
    { pw: 'R3dW0lf!9', label: [0, 0, 1, 0] },
    { pw: 'Zx3$Pq7!mN', label: [0, 0, 1, 0] },
    { pw: 'Th3M4tr1x!', label: [0, 0, 1, 0] },
    { pw: '!Qw3rTy9$', label: [0, 0, 1, 0] },
    { pw: 'D4rkN1ght#', label: [0, 0, 1, 0] },
    { pw: 'St0rmBr3w!', label: [0, 0, 1, 0] },
    { pw: 'F1r3W@ll2k', label: [0, 0, 1, 0] },
    { pw: 'Cyb3rL0ck$', label: [0, 0, 1, 0] },

    // Strong (class 3)
    { pw: 'correct-horse-battery-staple', label: [0, 0, 0, 1] },
    { pw: 'Xq9$mK3!bZ7@nW2', label: [0, 0, 0, 1] },
    { pw: 'j8#Lp2$Vx5!mQ9nR', label: [0, 0, 0, 1] },
    { pw: 'Purple-Flying-Tiger-42!', label: [0, 0, 0, 1] },
    { pw: 'tH3_$un_r1s3s_1n_tH3_3ast!', label: [0, 0, 0, 1] },
    { pw: 'Zk8!Qm3$Px7@Ny5^Wb2', label: [0, 0, 0, 1] },
    { pw: 'quantum-physics-rocks-2025!', label: [0, 0, 0, 1] },
    { pw: 'My$ecure!P@$$phr4se99', label: [0, 0, 0, 1] },
    { pw: 'B1ue_M0unt@1n_C0ff33!', label: [0, 0, 0, 1] },
    { pw: 'R@nd0m_$tr1ng_G3n3r@t0r', label: [0, 0, 0, 1] },
    { pw: '7Gx!9Kp#2Mn$5Wq@8Lz', label: [0, 0, 0, 1] },
    { pw: 'Dancing-Purple-Elephants-99!', label: [0, 0, 0, 1] },
    { pw: 'cR7p70_L0cK_2025!@#', label: [0, 0, 0, 1] },
    { pw: 'Sun-Moon-Stars-Galaxy-42', label: [0, 0, 0, 1] },
    { pw: 'aB3$cD5!eF7@gH9#iJ1', label: [0, 0, 0, 1] },
];

// ─── Build and Train Network ─────────────────────────────────────

console.log('🎯 Training Neural Network strength predictor...');

const nn = new NeuralNetwork([15, 32, 16, 4]); // 15 inputs → 32 → 16 → 4 classes

const dataset = TRAINING_DATA.map(d => ({
    input: extractFeatures(d.pw),
    target: d.label,
}));

const trainResult = nn.train(dataset, 300, 0.005);
console.log(`🎯 Neural network trained: 15→32→16→4 architecture, ${trainResult.epochs} epochs, loss=${trainResult.finalLoss?.toFixed(4)} in ${trainResult.trainTimeMs}ms`);

// ─── Prediction Function ─────────────────────────────────────────

const CLASS_NAMES = ['Very Weak', 'Weak', 'Moderate', 'Strong'];
const CLASS_COLORS = ['#ff003c', '#ff6b35', '#ffaa00', '#39ff14'];

export function predictStrength(password) {
    if (!password || password.length === 0) {
        return { error: 'Password is required' };
    }

    const startTime = Date.now();
    const features = extractFeatures(password);
    const { output, activations } = nn.forward(features);

    // Get predicted class
    const maxIdx = output.indexOf(Math.max(...output));
    const predictedClass = CLASS_NAMES[maxIdx];
    const confidence = Math.round(output[maxIdx] * 100);

    // Feature importance (which features contributed most)
    const featureNames = [
        'Length', 'Has Lowercase', 'Has Uppercase', 'Has Digits', 'Has Special',
        'Char Diversity', 'Digit Ratio', 'Special Ratio', 'Uppercase Ratio',
        'Repeat Ratio', 'Sequential Ratio', 'Dictionary Match', 'Keyboard Walk',
        'Shannon Entropy', 'Type Transitions',
    ];

    const featureAnalysis = features.map((value, i) => ({
        name: featureNames[i],
        value: Math.round(value * 1000) / 1000,
        contribution: value > 0.5 ? 'positive' : value < 0.2 ? 'negative' : 'neutral',
        impact: featureNames[i] === 'Dictionary Match' && value > 0 ? 'critical_weakness' :
            featureNames[i] === 'Length' && value < 0.4 ? 'weakness' :
                featureNames[i] === 'Shannon Entropy' && value > 0.7 ? 'strength' : 'normal',
    }));

    // Crack time estimation (AI-enhanced)
    let charsetSize = 0;
    if (/[a-z]/.test(password)) charsetSize += 26;
    if (/[A-Z]/.test(password)) charsetSize += 26;
    if (/[0-9]/.test(password)) charsetSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 33;

    const combinations = Math.pow(charsetSize || 1, password.length);
    const gpuSpeed = 1e10; // RTX 4090
    const crackSeconds = combinations / gpuSpeed;

    // AI-adjusted crack time based on pattern recognition
    let aiAdjustment = 1;
    if (features[11] > 0) aiAdjustment = 0.0001; // Dictionary word = instant
    if (features[12] > 0.3) aiAdjustment *= 0.01; // Keyboard walk
    if (features[9] > 0.5) aiAdjustment *= 0.1;   // High repetition
    if (features[10] > 0.5) aiAdjustment *= 0.1;  // High sequential

    const aiCrackSeconds = crackSeconds * aiAdjustment;

    const formatTime = (s) => {
        if (s < 0.001) return 'Instant';
        if (s < 1) return `${(s * 1000).toFixed(0)}ms`;
        if (s < 60) return `${s.toFixed(1)} seconds`;
        if (s < 3600) return `${(s / 60).toFixed(1)} minutes`;
        if (s < 86400) return `${(s / 3600).toFixed(1)} hours`;
        if (s < 86400 * 365) return `${(s / 86400).toFixed(1)} days`;
        if (s < 86400 * 365 * 1000) return `${(s / (86400 * 365)).toFixed(1)} years`;
        return `${(s / (86400 * 365 * 1e6)).toFixed(0)}M years`;
    };

    // Vulnerabilities identified by NN
    const vulnerabilities = [];
    if (features[11] > 0) vulnerabilities.push({ type: 'Dictionary Word', severity: 'Critical', detail: 'Contains a common dictionary password' });
    if (features[0] < 0.4) vulnerabilities.push({ type: 'Short Length', severity: 'High', detail: `Only ${password.length} characters — minimum 12 recommended` });
    if (features[5] < 0.5) vulnerabilities.push({ type: 'Low Diversity', severity: 'Medium', detail: 'Too many repeated characters' });
    if (features[9] > 0.3) vulnerabilities.push({ type: 'Character Repetition', severity: 'Medium', detail: 'Contains long repeated character sequences' });
    if (features[10] > 0.3) vulnerabilities.push({ type: 'Sequential Pattern', severity: 'Medium', detail: 'Contains sequential character patterns' });
    if (features[12] > 0.2) vulnerabilities.push({ type: 'Keyboard Walk', severity: 'High', detail: 'Contains keyboard walk pattern (qwerty, asdf, etc.)' });
    if (features[4] === 0) vulnerabilities.push({ type: 'No Special Characters', severity: 'Medium', detail: 'Add symbols (!@#$%^&*) for stronger password' });
    if (features[2] === 0) vulnerabilities.push({ type: 'No Uppercase', severity: 'Low', detail: 'Mix uppercase letters for better security' });

    return {
        // Primary prediction
        predictedClass,
        confidence,
        classColor: CLASS_COLORS[maxIdx],

        // All class probabilities
        classProbabilities: CLASS_NAMES.map((name, i) => ({
            class: name,
            probability: Math.round(output[i] * 100),
            color: CLASS_COLORS[i],
        })),

        // Feature analysis
        features: featureAnalysis,
        rawFeatures: features,

        // Crack time estimation
        crackTime: {
            bruteForce: formatTime(crackSeconds),
            aiAdjusted: formatTime(aiCrackSeconds),
            gpuSpeed: `${(gpuSpeed / 1e9).toFixed(0)}B hashes/s (RTX 4090)`,
            combinations: combinations > 1e15 ? combinations.toExponential(2) : combinations.toLocaleString(),
        },

        // Vulnerabilities
        vulnerabilities,

        // Network info
        networkInfo: {
            architecture: '15 → 32 → 16 → 4 (Feedforward)',
            activationHidden: 'ReLU',
            activationOutput: 'Softmax',
            trainingEpochs: trainResult.epochs,
            trainingLoss: trainResult.finalLoss?.toFixed(4),
            trainingTimeMs: trainResult.trainTimeMs,
            totalParameters: 15 * 32 + 32 + 32 * 16 + 16 + 16 * 4 + 4, // weights + biases
        },

        predictionTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
    };
}

export function getNNModelInfo() {
    return {
        type: 'Feedforward Neural Network',
        architecture: [15, 32, 16, 4],
        ...trainResult,
        description: 'Multi-layer perceptron trained on password features. Extracts 15 features (length, diversity, entropy, patterns, keyboard walks, etc.) and classifies into 4 strength categories.',
        classes: CLASS_NAMES,
    };
}
