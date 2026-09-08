<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Employee;
use App\Models\OnboardingTask;
use App\Models\LearningModule;
use App\Models\LearningQuizQuestion;

class LmsSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Onboarding Tasks for all existing employees
        $employees = Employee::all();

        $defaultTasks = [
            [
                'title' => 'Complete Profile Information & Emergency Contact Details',
                'description' => 'Verify personal details, emergency phone contacts, tax ID, and bank payment info in the HR profile.',
                'category' => 'HR & Compliance',
                'due_days' => 1,
                'priority' => 'high',
            ],
            [
                'title' => 'Setup Workstation, SSO, & Corporate Email Account',
                'description' => 'Log into Microsoft 365 / Workspace email, setup 2FA authenticator app, and setup Slack/Teams communication channels.',
                'category' => 'IT Setup',
                'due_days' => 1,
                'priority' => 'high',
            ],
            [
                'title' => 'Review Workplace Code of Conduct & Anti-Harassment Guidelines',
                'description' => 'Read and acknowledge company guidelines, remote work norms, dress code, and non-disclosure agreement.',
                'category' => 'HR & Compliance',
                'due_days' => 2,
                'priority' => 'medium',
            ],
            [
                'title' => 'Attend Day 1 Team Welcome & Orientation Call',
                'description' => 'Join your department manager and assigned buddy for an introductory orientation video call.',
                'category' => 'Team & Operations',
                'due_days' => 1,
                'priority' => 'high',
            ],
            [
                'title' => 'Complete Mandatory Cybersecurity Awareness Course',
                'description' => 'Watch the Data Privacy & Anti-Phishing training module and pass the completion quiz with 80%+ score.',
                'category' => 'Compliance',
                'due_days' => 3,
                'priority' => 'high',
            ],
        ];

        foreach ($employees as $emp) {
            foreach ($defaultTasks as $index => $taskData) {
                OnboardingTask::firstOrCreate(
                    [
                        'employee_id' => $emp->id,
                        'title' => $taskData['title'],
                    ],
                    array_merge($taskData, [
                        'is_completed' => ($index === 0), // Mark first task as completed for immediate UI demo
                        'completed_at' => ($index === 0) ? now() : null,
                    ])
                );
            }
        }

        // 2. Seed Learning Modules & Quiz Questions
        $modules = [
            [
                'title' => 'Workplace Ethics & Code of Conduct 2026',
                'description' => 'Essential compliance guide covering workplace professionalism, zero-tolerance policy against discrimination, reporting protocols, and corporate values.',
                'category' => 'Compliance',
                'content_type' => 'document',
                'content_url' => null,
                'document_text' => "### Section 1: Core Values & Mutual Respect\nAt Apex Global, we foster an inclusive, safe, and collaborative work environment. All employees are expected to uphold integrity, transparency, and respect in all daily interactions.\n\n### Section 2: Anti-Harassment & Discrimination Policy\nWe maintain zero tolerance for any form of harassment, discrimination, or bullying based on race, gender, age, religion, or background. Violations must be reported immediately to HR or through the anonymous compliance hotline.\n\n### Section 3: Protecting Intellectual Property & Confidental Information\nEmployees must keep proprietary client data, trade secrets, and internal operations strictly confidential both during and after their tenure.",
                'estimated_minutes' => 15,
                'passing_score' => 80,
                'is_published' => true,
                'questions' => [
                    [
                        'question' => 'What is Apex Global’s policy regarding workplace harassment and discrimination?',
                        'options' => [
                            'It is tolerated during busy launch periods',
                            'Zero tolerance policy with immediate investigation',
                            'Allowed if approved by department managers',
                            'Handled exclusively through informal peer resolution'
                        ],
                        'correct_option' => 1,
                        'explanation' => 'Apex Global maintains a strict zero-tolerance policy against any form of discrimination or harassment.'
                    ],
                    [
                        'question' => 'Where should suspected compliance violations or unethical behavior be reported?',
                        'options' => [
                            'Posted on public social media accounts',
                            'Directly to HR or through the compliance hotline',
                            'Kept private without notifying anyone',
                            'Submitted only after 6 months of employment'
                        ],
                        'correct_option' => 1,
                        'explanation' => 'Violations should be reported promptly to HR or via the official confidential hotline.'
                    ],
                    [
                        'question' => 'When are employees required to maintain confidentiality regarding company proprietary data?',
                        'options' => [
                            'Only during working hours (9 AM - 5 PM)',
                            'Only when working on premise',
                            'Both during and after their employment tenure',
                            'Only if signed on a paper contract'
                        ],
                        'correct_option' => 2,
                        'explanation' => 'Confidentiality obligations apply continuously, both during and after employment.'
                    ]
                ]
            ],
            [
                'title' => 'Cybersecurity & Data Protection Essentials',
                'description' => 'Learn how to detect spear phishing, secure remote connections, manage passwords safely, and prevent corporate data breaches.',
                'category' => 'Security',
                'content_type' => 'video',
                'content_url' => 'https://www.youtube.com/embed/bPVaOiJ5KA0', // Standard educational video embed
                'document_text' => "### Video Overview: Cybersecurity Essentials for Remote & Office Staff\nThis interactive module covers essential security habits:\n- Spotting suspicious email attachments & urgency cues in phishing messages.\n- Enforcing strong multi-factor authentication (2FA) across corporate systems.\n- Guidelines for handling customer Personally Identifiable Information (PII).",
                'estimated_minutes' => 20,
                'passing_score' => 80,
                'is_published' => true,
                'questions' => [
                    [
                        'question' => 'Which of the following is a key sign of a potential phishing email?',
                        'options' => [
                            'Sent from a verified internal domain address',
                            'Urgent language demanding password reset via external link',
                            'Includes standard company newsletter footer',
                            'Addressed directly to your official email name'
                        ],
                        'correct_option' => 1,
                        'explanation' => 'Phishing emails often create fake urgency and request sensitive credentials via untrusted external links.'
                    ],
                    [
                        'question' => 'What is the recommended practice for managing corporate passwords?',
                        'options' => [
                            'Use the same password across all personal and work sites',
                            'Write passwords down on a sticky note attached to your monitor',
                            'Use unique, complex passwords stored in an approved Password Manager',
                            'Share your login credentials with team colleagues when taking time off'
                        ],
                        'correct_option' => 2,
                        'explanation' => 'Unique complex passwords managed via an enterprise password manager ensure optimal account security.'
                    ],
                    [
                        'question' => 'What action should you take if you accidentally click a suspicious link in an unexpected email?',
                        'options' => [
                            'Immediately disconnect from network & notify IT Security team',
                            'Delete the email and ignore it',
                            'Forward the suspicious email to all team members',
                            'Turn off computer and leave it off for 48 hours'
                        ],
                        'correct_option' => 0,
                        'explanation' => 'Immediate reporting allows the IT security team to contain potential malware spread or breach risks.'
                    ]
                ]
            ],
            [
                'title' => 'Company Culture, Communication & Hybrid Work Norms',
                'description' => 'Discover how we collaborate across teams, standard Slack/Teams communication etiquettes, quarterly performance reviews, and work-life harmony.',
                'category' => 'Company Culture',
                'content_type' => 'document',
                'content_url' => null,
                'document_text' => "### Welcome to Our Community!\nOur culture is built on autonomy, psychological safety, and clear asynchronous communication.\n\n### Async First Communication\nWe respect deep focus time. When communicating via team chat:\n- Use clear, actionable thread responses.\n- Keep core working hours updated in your calendar status.\n- Document decisions in shared knowledge repositories.\n\n### Career Growth & Continuous Learning\nEvery employee is allocated annual learning budgets and dedicated quarterly growth reviews.",
                'estimated_minutes' => 10,
                'passing_score' => 70,
                'is_published' => true,
                'questions' => [
                    [
                        'question' => 'What is the core philosophy behind Apex Global’s asynchronous communication?',
                        'options' => [
                            'Expecting instant replies within 30 seconds at all hours',
                            'Respecting deep focus time with clear, contextual documentation',
                            'Only holding face-to-face in-person meetings',
                            'Avoiding written documentation'
                        ],
                        'correct_option' => 1,
                        'explanation' => 'Asynchronous communication prioritizes clear documentation and respects focus time.'
                    ],
                    [
                        'question' => 'How often are performance growth check-ins held with team managers?',
                        'options' => [
                            'Once every 5 years',
                            'Quarterly dedicated growth check-ins',
                            'Never',
                            'Only when errors occur'
                        ],
                        'correct_option' => 1,
                        'explanation' => 'Regular quarterly check-ins support continuous professional development and career alignment.'
                    ]
                ]
            ]
        ];

        foreach ($modules as $modData) {
            $questions = $modData['questions'];
            unset($modData['questions']);

            $module = LearningModule::firstOrCreate(
                ['title' => $modData['title']],
                $modData
            );

            foreach ($questions as $qData) {
                LearningQuizQuestion::firstOrCreate(
                    [
                        'learning_module_id' => $module->id,
                        'question' => $qData['question'],
                    ],
                    [
                        'options' => $qData['options'],
                        'correct_option' => $qData['correct_option'],
                        'explanation' => $qData['explanation'],
                    ]
                );
            }
        }
    }
}
