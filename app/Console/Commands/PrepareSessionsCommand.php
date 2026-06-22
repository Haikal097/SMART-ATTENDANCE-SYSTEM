<?php
// ─── app/Console/Commands/PrepareSessionsCommand.php ─────────────────────────
 
namespace App\Console\Commands;
 
use App\Jobs\PrepareSessionJob;
use Illuminate\Console\Command;
 
class PrepareSessionsCommand extends Command
{
    protected $signature   = 'sessions:prepare';
    protected $description = 'Push upcoming session face data to Raspberry Pi';
 
    public function handle(): void
    {
        $this->info('Checking for upcoming sessions...');
        PrepareSessionJob::dispatchSync();
        $this->info('Done.');
    }
}