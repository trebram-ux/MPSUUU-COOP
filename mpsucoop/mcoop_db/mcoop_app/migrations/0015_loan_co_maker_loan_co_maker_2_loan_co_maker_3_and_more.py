# Generated by Django 5.1.4 on 2025-02-20 06:17

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('mcoop_app', '0014_remove_loan_co_maker_remove_loan_co_maker_2_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='loan',
            name='co_maker',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='loan',
            name='co_maker_2',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='loan',
            name='co_maker_3',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='loan',
            name='co_maker_4',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='loan',
            name='co_maker_5',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AlterField(
            model_name='loan',
            name='control_number',
            field=models.CharField(default='d6ebd', max_length=5, primary_key=True, serialize=False),
        ),
    ]
