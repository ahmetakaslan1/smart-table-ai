<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        VerifyEmail::toMailUsing(function (object $notifiable, string $url) {
            return (new MailMessage)
                ->subject('Şantiye Net - E-Posta Adresinizi Doğrulayın')
                ->greeting('Merhaba!')
                ->line('Hesabınızı güvenle kullanmaya başlamak için lütfen e-posta adresinizi doğrulayın.')
                ->action('E-Posta Adresimi Doğrula', $url)
                ->line('Eğer Şantiye Net hesabı oluşturmadıysanız, bu e-postayı dikkate almayın.');
        });
    }
}
