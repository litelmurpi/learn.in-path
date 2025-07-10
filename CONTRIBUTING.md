# Contributing to LEARN.IN PATH

Terima kasih telah tertarik untuk berkontribusi pada LEARN.IN PATH! 🎉

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)

## 📜 Code of Conduct

Dengan berpartisipasi dalam project ini, Anda setuju untuk menjaga lingkungan yang ramah dan inklusif untuk semua kontributor.

## 🚀 Getting Started

1. Fork repository ini
2. Clone fork Anda:
   ```bash
   git clone https://github.com/YOUR-USERNAME/learn.in-path.git
   cd learn.in-path
   ```
3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/litelmurpi/learn.in-path.git
   ```

## 💻 Development Setup

1. Ikuti [Installation Guide](README.md#-cara-instalasi) di README
2. Buat branch baru untuk fitur Anda:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 🤝 How to Contribute

### Reporting Bugs

Buat issue baru dengan template bug report dan sertakan:
- Deskripsi jelas tentang bug
- Langkah-langkah untuk reproduksi
- Expected behavior vs actual behavior
- Screenshots jika memungkinkan
- Environment details (OS, browser, PHP version, etc.)

### Suggesting Features

1. Cek dulu apakah fitur sudah ada di issues
2. Buat issue baru dengan label `enhancement`
3. Jelaskan fitur dengan detail
4. Berikan contoh use case

### Code Contributions

1. Pilih issue yang ingin dikerjakan
2. Comment di issue tersebut untuk memberitahu Anda sedang mengerjakan
3. Ikuti coding standards
4. Tulis test untuk code Anda
5. Submit pull request

## 📝 Coding Standards

### PHP (Laravel)

- Follow PSR-12 coding standard
- Use meaningful variable and function names
- Add PHPDoc comments untuk methods
- Contoh:

```php
/**
 * Store a new study log for the authenticated user
 *
 * @param  \Illuminate\Http\Request  $request
 * @return \Illuminate\Http\JsonResponse
 */
public function store(Request $request): JsonResponse
{
    $validated = $request->validate([
        'topic' => 'required|string|max:255',
        'duration_minutes' => 'required|integer|min:1',
        'log_date' => 'required|date',
        'notes' => 'nullable|string'
    ]);

    $log = auth()->user()->studyLogs()->create($validated);

    return response()->json([
        'success' => true,
        'data' => $log
    ], 201);
}
```

### JavaScript

- Use ES6+ syntax
- camelCase untuk variables dan functions
- PascalCase untuk classes
- Contoh:

```javascript
// Good
const calculateTotalHours = (logs) => {
    return logs.reduce((total, log) => {
        return total + (log.duration_minutes / 60);
    }, 0);
};

// Bad
function calculate_total_hours(logs) {
    var total = 0;
    for(var i = 0; i < logs.length; i++) {
        total += logs[i].duration_minutes / 60;
    }
    return total;
}
```

### CSS/Tailwind

- Mobile-first approach
- Gunakan Tailwind classes daripada custom CSS jika memungkinkan
- Untuk custom CSS, gunakan BEM naming convention

## 💬 Commit Guidelines

Format commit message:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: Fitur baru
- `fix`: Bug fix
- `docs`: Perubahan dokumentasi
- `style`: Format, missing semi colons, etc
- `refactor`: Refactoring code
- `test`: Menambah test
- `chore`: Maintain

Contoh:
```
feat(auth): add remember me functionality

- Add remember me checkbox to login form
- Update authentication controller
- Add test for remember me feature

Closes #123
```

## 🔄 Pull Request Process

1. Update dokumentasi jika diperlukan
2. Pastikan semua test pass
3. Update README.md jika ada perubahan instalasi/usage
4. PR akan di-review oleh maintainer
5. Setelah approved, PR akan di-merge

### PR Title Format

```
[Type] Brief description
```

Contoh:
- `[Feature] Add export to PDF functionality`
- `[Fix] Resolve login redirect issue`
- `[Docs] Update API documentation`

## 🧪 Testing

### Running Tests

```bash
# All tests
php artisan test

# Specific test file
php artisan test tests/Feature/AuthenticationTest.php

# With coverage
php artisan test --coverage
```

### Writing Tests

```php
public function test_user_can_create_study_log()
{
    $user = User::factory()->create();
    
    $response = $this->actingAs($user)
        ->postJson('/api/study-logs', [
            'topic' => 'Laravel Testing',
            'duration_minutes' => 60,
            'log_date' => '2025-07-10',
            'notes' => 'Learned about feature tests'
        ]);

    $response->assertStatus(201)
        ->assertJsonStructure([
            'success',
            'data' => [
                'id',
                'topic',
                'duration_minutes',
                'log_date',
                'notes'
            ]
        ]);

    $this->assertDatabaseHas('study_logs', [
        'user_id' => $user->id,
        'topic' => 'Laravel Testing'
    ]);
}
```

## 🎯 Areas for Contribution

Current areas where we need help:

- [ ] Unit tests coverage
- [ ] UI/UX improvements
- [ ] Performance optimization
- [ ] Documentation
- [ ] Bug fixes
- [ ] New features from issues

---

Thank you for contributing! 🙏
