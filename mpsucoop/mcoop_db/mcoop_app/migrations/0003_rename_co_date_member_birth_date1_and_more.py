# Generated by Django 5.1.4 on 2025-01-29 12:14

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('mcoop_app', '0002_alter_loan_control_number'),
    ]

    operations = [
        migrations.RenameField(
            model_name='member',
            old_name='co_date',
            new_name='birth_date1',
        ),
        migrations.RenameField(
            model_name='member',
            old_name='com_date',
            new_name='birth_date2',
        ),
        migrations.RenameField(
            model_name='member',
            old_name='make_date',
            new_name='birth_date3',
        ),
        migrations.RenameField(
            model_name='member',
            old_name='co_make',
            new_name='co_maker2',
        ),
        migrations.RenameField(
            model_name='member',
            old_name='com_make',
            new_name='co_maker3',
        ),
        migrations.RemoveField(
            model_name='member',
            name='addresss_co',
        ),
        migrations.RemoveField(
            model_name='member',
            name='relationship_co',
        ),
        migrations.RemoveField(
            model_name='member',
            name='relationship_com',
        ),
        migrations.RemoveField(
            model_name='member',
            name='relationship_make',
        ),
        migrations.AddField(
            model_name='member',
            name='addresss',
            field=models.CharField(default='Unknown', max_length=255),
        ),
        migrations.AddField(
            model_name='member',
            name='relationship2',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='member',
            name='relationship3',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AlterField(
            model_name='loan',
            name='control_number',
            field=models.CharField(default='b8dcd', max_length=5, primary_key=True, serialize=False),
        ),
    ]
